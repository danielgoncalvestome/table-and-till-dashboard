import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ImportedDish = { name: string; description: string; price: number; images: number[] };
export type ImportedCategory = { name: string; dishes: ImportedDish[] };
export type ImportedMenu = { menuName: string; categories: ImportedCategory[] };

type Ctx = { supabase: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown }> }; userId: string };
async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Acesso reservado ao administrador da plataforma");
}

const MAX_IMAGES = 20;
function checkImages(images: string[]) {
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) throw new Error(`Envia entre 1 e ${MAX_IMAGES} imagens`);
  for (const i of images) if (typeof i !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(i)) throw new Error("Formato de imagem inválido");
}

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["menuName", "categories"],
  properties: {
    menuName: { type: "string" },
    categories: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "dishes"], properties: {
      name: { type: "string" },
      dishes: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "description", "price", "images"], properties: {
        name: { type: "string" }, description: { type: "string" }, price: { type: "number" },
        images: { type: "array", items: { type: "integer" } },
      } } },
    } } },
  },
};

const PROMPT = `És um assistente que cria menus digitais de restaurantes portugueses a partir de imagens.
As imagens estão numeradas a partir de 0 (indicado antes de cada uma). Há dois tipos:
1) Fotografias/capturas do MENU (lista de pratos com preços, ardósia, folha impressa).
2) Fotografias de PRATOS (comida).
Regras:
- Usa os pratos e PREÇOS exatamente como estão tabelados nas fotos do menu (em euros, número decimal, ex. 12.5). Nunca inventes preços; se um prato não tiver preço visível, usa 0.
- Se só existirem fotos de pratos sem menu, cria pratos plausíveis a partir delas com preço 0.
- Agrupa os pratos em categorias (ex.: Entradas, Pratos de Peixe, Pratos de Carne, Sobremesas, Bebidas), mantendo a ordem do menu.
- Em "images" coloca os índices das fotografias de PRATOS que mostram esse prato. Várias fotos do MESMO prato vão todas para o mesmo prato (a primeira é a principal, as outras secundárias). Nunca cries pratos duplicados por haver várias fotos. Nunca incluas índices de fotos do menu.
- Cada foto de prato deve ser atribuída a no máximo um prato. Se não corresponder a nenhum prato do menu, cria um prato para ela.
- Descrições curtas em português (pt-PT); usa a do menu se existir, senão escreve uma frase breve ou deixa vazio.
- menuName: nome curto para o menu (ex.: "Menu principal").`;

export const analyzeMenuImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { images: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    checkImages(data.images);
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "high" }> = [{ type: "input_text", text: PROMPT }];
    data.images.forEach((url, i) => { content.push({ type: "input_text", text: `Imagem ${i}:` }); content.push({ type: "input_image", image_url: url, detail: "high" }); });
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content }],
        text: { format: { type: "json_schema", name: "menu", schema: SCHEMA, strict: true } },
      });
      let text = "";
      for (const item of (res as { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }).output ?? [])
        if (item.type === "message") for (const c of item.content ?? []) if (c.type === "output_text") text += c.text ?? "";
      const parsed = JSON.parse(text) as ImportedMenu;
      const used = new Set<number>();
      for (const cat of parsed.categories) for (const d of cat.dishes) {
        d.price = Math.max(0, Math.round((Number(d.price) || 0) * 100) / 100);
        d.images = d.images.filter((i) => Number.isInteger(i) && i >= 0 && i < data.images.length && !used.has(i) && (used.add(i), true));
      }
      return parsed;
    } catch (e) {
      console.error("menu import AI error", e);
      if (e instanceof GatewayError && e.code === "payment_required") throw new Error("Sem créditos de IA disponíveis");
      if (e instanceof GatewayError && e.httpStatus === 429) throw new Error("Muitos pedidos, tenta daqui a pouco");
      throw new Error("A IA não conseguiu ler as imagens. Tenta novamente.");
    }
  });

export const createImportedMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { restaurantId: string; menu: ImportedMenu; images: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    checkImages(data.images);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rest } = await supabaseAdmin.from("restaurants").select("id").eq("id", data.restaurantId).maybeSingle();
    if (!rest) throw new Error("Restaurante não encontrado");
    const urls = new Map<number, string>();
    const upload = async (i: number) => {
      if (urls.has(i)) return urls.get(i)!;
      const m = /^data:(image\/\w+);base64,(.+)$/.exec(data.images[i]);
      if (!m) throw new Error("Imagem inválida");
      const bin = atob(m[2]); const bytes = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
      const path = `${data.restaurantId}/ai-${crypto.randomUUID()}.${m[1].split("/")[1]}`;
      const { error } = await supabaseAdmin.storage.from("menu-images").upload(path, bytes, { contentType: m[1] });
      if (error) throw new Error("Falha ao guardar imagem");
      const { data: s } = await supabaseAdmin.storage.from("menu-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      urls.set(i, s!.signedUrl); return s!.signedUrl;
    };
    const { count } = await supabaseAdmin.from("menus").select("id", { count: "exact", head: true }).eq("restaurant_id", data.restaurantId);
    const { data: menu, error: me } = await supabaseAdmin.from("menus").insert({ restaurant_id: data.restaurantId, name: data.menu.menuName.trim().slice(0, 80) || "Menu", position: count ?? 0 }).select("id").single();
    if (me || !menu) throw new Error("Falha ao criar menu");
    let dishes = 0;
    for (const [ci, cat] of data.menu.categories.entries()) {
      const { data: c, error: ce } = await supabaseAdmin.from("categories").insert({ restaurant_id: data.restaurantId, menu_id: menu.id, name: cat.name.trim().slice(0, 80) || "Pratos", position: ci }).select("id").single();
      if (ce || !c) throw new Error("Falha ao criar categoria");
      for (const [di, d] of cat.dishes.entries()) {
        const imgs = [];
        for (const i of d.images.filter((i) => i >= 0 && i < data.images.length)) imgs.push(await upload(i));
        const { error: de } = await supabaseAdmin.from("dishes").insert({
          restaurant_id: data.restaurantId, category_id: c.id, name: d.name.trim().slice(0, 120) || "Prato",
          description: d.description?.trim() || null, price: Math.max(0, Number(d.price) || 0), position: di,
          image_url: imgs[0] ?? null, gallery: imgs.slice(1),
        });
        if (de) throw new Error("Falha ao criar prato");
        dishes++;
      }
    }
    await supabaseAdmin.from("audit_logs").insert({ restaurant_id: data.restaurantId, actor_id: context.userId, action: "admin.ai_menu_import", details: { menu_id: menu.id, dishes } } as never).then(() => {}, () => {});
    return { menuId: menu.id, dishes };
  });
