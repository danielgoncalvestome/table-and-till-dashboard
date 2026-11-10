import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — MenuTap" },
      { name: "description", content: "Como o MenuTap trata dados pessoais, em conformidade com o RGPD." },
      { property: "og:title", content: "Política de privacidade — MenuTap" },
      { property: "og:description", content: "Privacidade e RGPD no MenuTap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const { lang, t } = useI18n();
  const body = lang === "pt"
    ? [PRIVACY_PT]
    : ["Restaurant guests browse menus without signing up. We only record anonymous events (views, searches, language) tied to a random session identifier, without name, email or IP address.", "Restaurant accounts store the user's email and name for authentication. You can request export or deletion of your data at ola@menutap.pt.", "Data is hosted in the European Union where possible and is never sold to third parties.", "Provisional document — must be reviewed by a lawyer before commercial launch."];
  return (
    <SitePage>
      <PageIntro title={t("footer.privacy")} />
      <div className="mx-auto max-w-3xl space-y-4 px-5 text-muted-foreground">{body.map((p) => <p key={p} className="whitespace-pre-line">{p}</p>)}</div>
    </SitePage>
  );
}

const PRIVACY_PT = `Política de Privacidade — MenuTap

Última atualização: 10/11/2026

1. Introdução

A presente Política de Privacidade explica como o MenuTap recolhe, utiliza, conserva e protege os dados pessoais dos utilizadores do website, dos restaurantes registados na plataforma e dos visitantes dos menus digitais.

O MenuTap compromete-se a tratar os dados pessoais de forma transparente, segura e responsável, em conformidade com o Regulamento Geral sobre a Proteção de Dados (Regulamento UE 2016/679 — RGPD) e demais legislação aplicável.

2. Responsável pelo tratamento

O responsável pelo tratamento dos dados pessoais é:

Titular: MenuTap

3. Que dados pessoais recolhemos?

Dependendo da forma como utiliza o MenuTap, poderemos recolher diferentes categorias de dados.

3.1. Dados de registo e conta

Quando um restaurante cria uma conta, poderemos recolher:

Nome do responsável pela conta;

Endereço de email;

Nome e identificação do estabelecimento;

Número de telefone, quando fornecido;

Credenciais de autenticação;

Informações relacionadas com a subscrição.

3.2. Dados de faturação e pagamento

No âmbito da contratação de serviços pagos, poderão ser tratados dados necessários à gestão de pagamentos e faturação, incluindo:

Nome ou denominação da entidade;

Número de identificação fiscal;

Morada de faturação;

Histórico de pagamentos e subscrições;

Informações relativas às faturas emitidas.

Os pagamentos poderão ser processados por prestadores externos especializados. Os dados bancários ou de cartão de pagamento serão tratados de acordo com as condições e políticas desses prestadores, não sendo necessário que o MenuTap tenha acesso aos dados completos do cartão.

3.3. Dados de utilização da plataforma

Durante a utilização do website e da plataforma, poderemos recolher:

Endereço IP;

Tipo de dispositivo e navegador;

Data e hora de acesso;

Registos técnicos e de segurança;

Páginas e funcionalidades utilizadas;

Interações com os menus digitais;

Dados estatísticos de utilização.

3.4. Dados dos visitantes dos menus digitais

Quando um visitante consulta um menu digital, poderão ser recolhidos dados técnicos e estatísticos relacionados com essa utilização, incluindo:

Número de visualizações e sessões;

Produtos e categorias consultados;

Interações com funcionalidades do menu;

Tipo de dispositivo e navegador;

Informação técnica necessária à segurança e funcionamento do serviço.

O MenuTap não exige que os visitantes criem uma conta para consultar os menus digitais.

Não solicitamos deliberadamente dados pessoais sensíveis através da consulta normal dos menus.

4. Para que utilizamos os dados?

Os dados pessoais poderão ser utilizados para as seguintes finalidades:

Finalidade — Fundamento jurídico
Criar e gerir contas — Execução de contrato
Disponibilizar os menus digitais — Execução de contrato
Gerir subscrições e pagamentos — Execução de contrato e obrigação legal
Emitir faturas e cumprir obrigações fiscais — Obrigação legal
Prestar apoio ao cliente — Execução de contrato ou interesse legítimo
Garantir a segurança da plataforma — Interesse legítimo
Analisar a utilização e melhorar o serviço — Interesse legítimo ou consentimento, conforme a tecnologia utilizada
Enviar comunicações comerciais — Consentimento ou outra base legal aplicável

O MenuTap não utilizará os dados para finalidades incompatíveis com aquelas para as quais foram recolhidos.

5. Tratamento de dados em nome dos restaurantes

Os restaurantes que utilizam o MenuTap podem determinar as finalidades e os meios de tratamento de determinados dados relacionados com a utilização dos seus menus.

Nessas situações, o restaurante poderá atuar como responsável pelo tratamento e o MenuTap como subcontratante, tratando os dados por conta do restaurante e de acordo com as respetivas instruções.

O MenuTap poderá, por exemplo, tratar dados de utilização dos menus para disponibilizar estatísticas e relatórios ao restaurante.

Quando aplicável, a relação entre o MenuTap e o restaurante será regulada por condições específicas de tratamento de dados, nos termos do artigo 28.º do RGPD.

6. Partilha de dados com terceiros

O MenuTap poderá recorrer a prestadores de serviços externos para assegurar o funcionamento da plataforma, incluindo:

Alojamento e armazenamento de dados;

Infraestrutura tecnológica;

Serviços de autenticação;

Processamento de pagamentos;

Envio de comunicações eletrónicas;

Análise estatística e monitorização técnica.

Estes prestadores apenas terão acesso aos dados necessários à prestação dos respetivos serviços e estarão sujeitos às obrigações contratuais e legais aplicáveis.

O MenuTap não vende dados pessoais a terceiros.

Os dados poderão ainda ser comunicados a autoridades públicas quando tal seja exigido por lei ou por decisão legítima de uma autoridade competente.

7. Transferências internacionais de dados

Sempre que sejam utilizados prestadores de serviços localizados fora do Espaço Económico Europeu, ou que impliquem transferências internacionais de dados, o MenuTap procurará assegurar que essas transferências cumprem os requisitos previstos no RGPD.

Poderão ser utilizadas decisões de adequação da Comissão Europeia ou garantias adequadas, incluindo cláusulas contratuais-tipo, quando aplicável.

8. Conservação dos dados

Os dados pessoais serão conservados apenas durante o período necessário às finalidades para as quais foram recolhidos.

Em particular:

Os dados da conta serão conservados enquanto a conta permanecer ativa;

Os dados de faturação serão conservados durante os prazos legalmente exigidos;

Os registos de segurança serão conservados pelo período necessário à proteção e integridade da plataforma;

Os dados estatísticos poderão ser conservados de forma agregada ou anonimizada, quando deixem de permitir identificar os titulares.

Após o cancelamento de uma conta, os dados serão eliminados ou anonimizados quando deixarem de ser necessários, sem prejuízo de obrigações legais ou da necessidade de conservação para o exercício ou defesa de direitos.

9. Segurança dos dados

O MenuTap adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração, divulgação ou destruição.

Estas medidas poderão incluir mecanismos de autenticação, controlo de acessos, utilização de ligações seguras, cópias de segurança e monitorização técnica.

Apesar dos esforços desenvolvidos, nenhum sistema informático pode garantir segurança absoluta.

10. Direitos dos titulares dos dados

Nos termos do RGPD, os titulares dos dados poderão exercer, quando aplicável, os seguintes direitos:

Direito de acesso aos dados pessoais;

Direito de retificação de dados incorretos ou incompletos;

Direito ao apagamento dos dados;

Direito à limitação do tratamento;

Direito de oposição ao tratamento;

Direito à portabilidade dos dados;

Direito de retirar o consentimento, quando o tratamento se baseie nesse consentimento;

Direito de apresentar reclamação junto da autoridade de controlo competente.

Em Portugal, a autoridade de controlo é a Comissão Nacional de Proteção de Dados (CNPD).

Os pedidos relacionados com o exercício destes direitos poderão ser enviados para [Email de privacidade].

O MenuTap poderá solicitar informações adicionais para confirmar a identidade do requerente, quando necessário.

11. Cookies e tecnologias semelhantes

O website e a plataforma poderão utilizar cookies e tecnologias semelhantes para assegurar o funcionamento dos serviços, memorizar preferências, analisar a utilização e melhorar a experiência dos utilizadores.

Os cookies estritamente necessários ao funcionamento do website poderão ser utilizados sem consentimento, nos termos legais aplicáveis.

Os cookies de análise, publicidade ou outras finalidades não essenciais apenas serão utilizados quando exista uma base legal adequada e, quando exigido, após a obtenção do consentimento do utilizador.

Os utilizadores poderão gerir as suas preferências através das opções disponibilizadas no website e das configurações do respetivo navegador.

12. Comunicações comerciais

O MenuTap poderá enviar comunicações relacionadas com a conta, subscrição, segurança e funcionamento do serviço.

As comunicações de marketing ou promocionais serão enviadas apenas quando exista fundamento legal para o efeito.

Quando aplicável, o utilizador poderá retirar o consentimento ou opor-se à receção dessas comunicações através do mecanismo disponibilizado na própria mensagem ou mediante contacto com o MenuTap.

13. Privacidade de menores

A plataforma destina-se principalmente a estabelecimentos comerciais e aos respetivos utilizadores.

O MenuTap não procura recolher deliberadamente dados pessoais de menores para fins de criação de contas ou marketing.

14. Alterações à Política de Privacidade

A presente Política de Privacidade poderá ser atualizada sempre que necessário, nomeadamente em consequência de alterações legais, técnicas ou funcionais da plataforma.

A versão mais recente estará sempre disponível nesta página, acompanhada da respetiva data de atualização.`;
