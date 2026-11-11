import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos e condições — MenuTap" },
      { name: "description", content: "Termos de utilização da plataforma MenuTap." },
      { property: "og:title", content: "Termos e condições — MenuTap" },
      { property: "og:description", content: "Termos de utilização do MenuTap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  const { lang, t } = useI18n();
  const body = lang === "pt"
    ? [TERMS_PT]
    : ["MenuTap provides a digital menu platform through a monthly subscription, with a free trial period.", "The restaurant is responsible for the accuracy of published prices, ingredients and allergens.", "You are contracting with Daniel Gonçalves Tomé, trading as MenuTap. By using the service you accept these terms. You must not misuse it (unlawful use, fraud, spam, IP infringement, malware, probing or scraping). MenuTap retains all IP in the service, which is provided without guarantee of uninterrupted or error-free operation.", "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Payment, billing, tax, cancellation and refunds are also governed by the Paddle Buyer Terms (https://www.paddle.com/legal/checkout-buyer-terms).", "You can cancel anytime; refunds follow our 14-day Refund Policy. We may suspend or terminate access for material breach, non-payment, security or fraud risk, or repeated policy violations."];
  return (
    <SitePage>
      <PageIntro title={t("footer.terms")} />
      <div className="mx-auto max-w-3xl space-y-4 px-5 text-muted-foreground">{body.map((p) => <p key={p} className="whitespace-pre-line">{p}</p>)}</div>
    </SitePage>
  );
}

const TERMS_PT = `Termos e Condições de Utilização — MenuTap

Última atualização: 10/11/2026

1. Identificação

O presente website e a plataforma MenuTap são operados por:

Titular: MenuTap 
ATENÇÃO: O website e a plataforma MenuTap são um projeto independente em fase de desenvolvimento e lançamento, dedicado à disponibilização de soluções digitais para estabelecimentos de restauração. 
Website: https://menutap.pt

Neste documento, a expressão «MenuTap» refere-se ao titular e operador da plataforma e a expressão «Cliente» refere-se ao restaurante ou entidade que cria uma conta e utiliza os serviços disponibilizados.

2. Objeto e âmbito

O MenuTap é uma plataforma digital destinada a estabelecimentos de restauração e bebidas, permitindo a criação, publicação e gestão de menus digitais acessíveis através de QR Code ou tecnologia NFC.

A plataforma poderá disponibilizar funcionalidades como:

Criação e personalização de menus digitais;

Gestão de categorias, produtos, preços, descrições e fotografias;

Identificação de alergénios e características alimentares;

Disponibilização de menus em diferentes idiomas;

Gestão da disponibilidade de produtos;

Publicação de promoções e menus especiais;

Acesso a estatísticas e indicadores de utilização;

Outras funcionalidades disponibilizadas no âmbito do serviço.

A utilização da plataforma implica a aceitação dos presentes Termos e Condições.

3. Registo e conta de utilizador

Para utilizar as funcionalidades de gestão, o Cliente deverá criar uma conta e fornecer informações verdadeiras, completas e atualizadas.

O Cliente é responsável por:

Manter a confidencialidade das suas credenciais de acesso;

Garantir que apenas pessoas autorizadas acedem à sua conta;

Manter atualizados os dados associados à conta;

Comunicar qualquer utilização não autorizada de que tenha conhecimento.

O MenuTap reserva-se o direito de suspender ou limitar contas em caso de incumprimento grave destes termos, falta de pagamento, risco de segurança ou fraude, ou violações repetidas ou graves das regras de utilização.

4. Utilização da plataforma

O Cliente compromete-se a utilizar o MenuTap de forma legal e responsável.

É da exclusiva responsabilidade do Cliente:

Garantir que os preços, descrições e informações publicados são corretos e atualizados;

Garantir que dispõe dos direitos necessários para utilizar fotografias, logótipos, textos e outros conteúdos carregados;

Assegurar a exatidão das informações relativas a alergénios, ingredientes e características alimentares;

Cumprir a legislação aplicável à atividade de restauração;

Não utilizar a plataforma para fins ilícitos, fraudulentos ou que prejudiquem terceiros.

O MenuTap disponibiliza ferramentas de publicação e gestão de informação, não sendo responsável pela exatidão, legalidade ou atualização dos conteúdos introduzidos pelo Cliente.

5. Menus digitais, QR Code e NFC

Os menus digitais são disponibilizados através de endereços eletrónicos próprios, que poderão ser associados a códigos QR ou etiquetas NFC.

O Cliente reconhece que:

O funcionamento do menu depende da disponibilidade da plataforma e de uma ligação à Internet por parte do visitante;

As etiquetas NFC e os códigos QR funcionam como meios de acesso ao endereço do menu;

O MenuTap não garante a compatibilidade com todos os dispositivos móveis existentes;

A alteração dos conteúdos do menu não exige necessariamente a substituição do código QR ou etiqueta NFC, desde que seja mantido o mesmo endereço eletrónico.

O Cliente é responsável pela correta instalação e utilização dos materiais físicos fornecidos ou adquiridos.

6. Planos, preços e pagamentos

O acesso às funcionalidades do MenuTap poderá estar sujeito a uma subscrição paga, de acordo com os planos e preços apresentados no website.

Salvo indicação em contrário:

Os preços apresentados não incluem IVA, quando este seja legalmente aplicável;

A subscrição é faturada com a periodicidade indicada no momento da contratação;

O pagamento deverá ser efetuado através dos meios disponibilizados na plataforma;

O nosso processo de encomenda é conduzido pelo nosso revendedor online Paddle.com. A Paddle.com é o Merchant of Record de todas as nossas encomendas. A Paddle presta todo o apoio ao cliente relativo a pagamentos e trata das devoluções. Os pagamentos, a faturação, os impostos, os cancelamentos e os reembolsos regem-se também pelos Termos do Comprador da Paddle (https://www.paddle.com/legal/checkout-buyer-terms);

As condições específicas de cada plano são apresentadas antes da confirmação da subscrição.

O MenuTap poderá alterar os preços ou funcionalidades dos planos, comunicando previamente as alterações aos Clientes com subscrições ativas.

As alterações de preço não produzem efeitos retroativos sobre períodos já pagos.

7. Períodos de experimentação

O MenuTap poderá disponibilizar períodos de experimentação gratuitos, sujeitos às condições apresentadas no momento da adesão.

Durante esse período, o Cliente poderá experimentar as funcionalidades incluídas na oferta.

A passagem para uma subscrição paga não será efetuada sem a respetiva aceitação ou contratação pelo Cliente.

O MenuTap poderá limitar a duração, disponibilidade ou condições das ofertas de experimentação.

8. Cancelamento da subscrição

O Cliente poderá cancelar a sua subscrição através dos meios disponibilizados na plataforma ou mediante contacto com o MenuTap.

Salvo indicação em contrário:

O cancelamento impede a renovação dos períodos seguintes;

O acesso às funcionalidades pagas mantém-se até ao final do período já pago;

Os reembolsos regem-se pela nossa Política de Reembolso (https://menutap.pt/refund), que prevê uma garantia de reembolso de 14 dias.

Após o cancelamento, o MenuTap poderá eliminar ou anonimizar os dados associados à conta, respeitando os prazos de conservação legalmente aplicáveis e as condições da Política de Privacidade.

9. Disponibilidade e manutenção

O MenuTap procurará assegurar o funcionamento regular e seguro da plataforma.

Contudo, não garante disponibilidade ininterrupta ou ausência de erros, podendo ocorrer interrupções decorrentes de:

Operações de manutenção ou atualização;

Falhas de fornecedores externos;

Problemas de conectividade ou infraestrutura;

Situações técnicas ou de força maior.

Sempre que possível, o MenuTap procurará minimizar o impacto destas interrupções.

10. Estatísticas e informações de utilização

A plataforma poderá disponibilizar indicadores estatísticos relativos à utilização dos menus digitais, incluindo visualizações, sessões, consultas de produtos e outras interações.

Estes indicadores têm natureza meramente informativa e destinam-se a apoiar a análise do desempenho dos menus.

O MenuTap não garante que os indicadores correspondam a vendas, compras efetivas ou decisões de consumo, nem que representem integralmente o comportamento dos visitantes.

11. Propriedade intelectual

A plataforma MenuTap, incluindo o seu software, estrutura, design, elementos gráficos, marca e conteúdos próprios, encontra-se protegida pela legislação aplicável em matéria de propriedade intelectual.

A utilização do serviço não confere ao Cliente qualquer direito de propriedade sobre a plataforma ou os seus componentes.

O Cliente mantém os direitos sobre os conteúdos que introduz na plataforma, concedendo ao MenuTap apenas a licença necessária para alojar, processar, reproduzir e apresentar esses conteúdos no âmbito da prestação do serviço.

12. Responsabilidade

O MenuTap não será responsável por:

Erros ou omissões nos conteúdos publicados pelo Cliente;

Informações incorretas sobre preços, ingredientes ou alergénios;

Perdas decorrentes da utilização indevida da conta pelo Cliente;

Indisponibilidades causadas por terceiros ou circunstâncias fora do seu controlo;

Danos resultantes da utilização da plataforma em desconformidade com estes termos.

Nada nos presentes termos exclui ou limita responsabilidades que não possam ser excluídas ou limitadas nos termos da legislação aplicável.

13. Proteção de dados pessoais

O tratamento de dados pessoais no âmbito da utilização do MenuTap é realizado de acordo com a respetiva Política de Privacidade e com a legislação aplicável, nomeadamente o Regulamento Geral sobre a Proteção de Dados (RGPD).

Quando o MenuTap trate dados por conta do Cliente, poderão aplicar-se condições específicas de subcontratação de dados pessoais.

14. Alterações aos Termos e Condições

O MenuTap poderá atualizar os presentes Termos e Condições sempre que necessário.

As alterações serão publicadas nesta página, com indicação da respetiva data de atualização.

Quando as alterações sejam relevantes para os Clientes com contas ativas, estes poderão ser informados através dos contactos associados à conta.

15. Lei aplicável e resolução de litígios

Os presentes Termos e Condições são regidos pela legislação portuguesa e pela legislação da União Europeia aplicável.

Em caso de litígio, as partes procurarão, sempre que possível, alcançar uma solução amigável.

Na ausência de acordo, será competente o tribunal determinado pelas regras legais de competência aplicáveis, sem prejuízo de normas imperativas de proteção do consumidor, quando aplicáveis.`;
