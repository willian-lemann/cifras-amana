// Seed de mock data para os leads (CRM / Painel).
//
// Conecta direto no Postgres (via `pg` + DATABASE_URL do .env), insere leads
// de exemplo na conta do corretor e marca cada linha com id `seedmock_…` para
// remoção trivial — não toca em nenhum lead real.
//
// Uso (Node 22):
//   node scripts/seed-leads.mjs                      → conta padrão (willianleman+dev@gmail.com)
//   node scripts/seed-leads.mjs outro@email.com      → outra conta (por e-mail)
//   node scripts/seed-leads.mjs --clean              → só remove os mocks (seedmock_*)
//
// Lembre-se de prefixar o PATH do Node 22 neste ambiente:
//   export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"

import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const DEFAULT_EMAIL = "willianleman+dev@gmail.com";
const ID_PREFIX = "seedmock_";

const args = process.argv.slice(2);
const cleanOnly = args.includes("--clean");
const targetEmail = args.find((a) => a.includes("@")) ?? DEFAULT_EMAIL;

const mockId = () => ID_PREFIX + randomUUID();
const daysAgo = (d, h = 0) =>
  new Date(Date.now() - d * 86_400_000 - h * 3_600_000);

// Leads da página de corretor (BrokerLead — só precisam do userId).
const BROKER_LEADS = [
  {
    name: "Ana Beatriz Souza",
    phone: "+55 51 99811-2233",
    email: "ana.souza@gmail.com",
    source: "WHATSAPP",
    status: "NEW",
    message: "Vi seu perfil e tenho interesse em apartamentos no centro.",
    notes: null,
    d: 0,
  },
  {
    name: "Carlos Eduardo Lima",
    phone: "+55 11 98123-4567",
    email: null,
    source: "FORM",
    status: "NEW",
    message: "Gostaria de agendar uma visita ainda esta semana.",
    notes: null,
    d: 1,
  },
  {
    name: "Mariana Oliveira",
    phone: null,
    email: "mariana.oliveira@hotmail.com",
    source: "FORM",
    status: "CONTACTED",
    message: "Qual o valor de entrada e as condições de financiamento?",
    notes: "Retornar na quinta de manhã.",
    d: 2,
  },
  {
    name: "João Pedro Santos",
    phone: "+55 21 99654-3210",
    email: "joao.santos@gmail.com",
    source: "WHATSAPP",
    status: "QUALIFIED",
    message: "Tenho FGTS e quero financiar pela Caixa.",
    notes: "Pré-aprovado no banco.",
    d: 4,
  },
  {
    name: "Fernanda Costa",
    phone: "+55 31 99876-1122",
    email: "fernanda.costa@outlook.com",
    source: "FORM",
    status: "NEW",
    message: null,
    notes: null,
    d: 5,
  },
  {
    name: "Rafael Almeida",
    phone: "+55 51 98700-5544",
    email: "rafael.almeida@gmail.com",
    source: "WHATSAPP",
    status: "WON",
    message: "Quero fechar negócio no apto que vi.",
    notes: "Fechado! 🎉 Assinou o contrato.",
    d: 8,
  },
  {
    name: "Juliana Ribeiro",
    phone: null,
    email: "juliana.ribeiro@gmail.com",
    source: "FORM",
    status: "LOST",
    message: "Achei o valor um pouco acima do meu orçamento.",
    notes: "Comprou com concorrente.",
    d: 12,
  },
  {
    name: "Bruno Carvalho",
    phone: "+55 48 99988-7766",
    email: null,
    source: "WHATSAPP",
    status: "CONTACTED",
    message: "Esse imóvel ainda está disponível?",
    notes: null,
    d: 3,
  },
  {
    name: "Patrícia Gomes",
    phone: "+55 11 97654-3322",
    email: "patricia.gomes@gmail.com",
    source: "FORM",
    status: "NEW",
    message: "Podem me ligar para conversar sobre valores?",
    notes: null,
    d: 6,
  },
];

// Leads de páginas de venda (Lead — precisam de um hotsite + listing reais).
const SALES_LEADS = [
  {
    name: "Lucas Martins",
    phone: "+55 51 99001-2030",
    email: "lucas.martins@gmail.com",
    source: "WHATSAPP",
    status: "NEW",
    message: "Esse imóvel ainda está disponível?",
    notes: null,
    d: 1,
  },
  {
    name: "Camila Ferreira",
    phone: "+55 11 98555-1212",
    email: "camila.ferreira@hotmail.com",
    source: "FORM",
    status: "CONTACTED",
    message: "Aceita permuta por um imóvel menor?",
    notes: "Enviar mais fotos da cozinha.",
    d: 3,
  },
  {
    name: "Thiago Barbosa",
    phone: null,
    email: "thiago.barbosa@gmail.com",
    source: "FORM",
    status: "QUALIFIED",
    message: "Quero visitar no sábado de manhã.",
    notes: null,
    d: 5,
  },
  {
    name: "Larissa Rocha",
    phone: "+55 21 99777-8080",
    email: "larissa.rocha@outlook.com",
    source: "WHATSAPP",
    status: "NEW",
    message: "Qual o valor do condomínio e do IPTU?",
    notes: null,
    d: 7,
  },
  {
    name: "Gustavo Nogueira",
    phone: "+55 31 98444-9090",
    email: "gustavo.nogueira@gmail.com",
    source: "FORM",
    status: "WON",
    message: "Gostei muito, vamos fechar!",
    notes: "Assinou contrato, comissão a receber.",
    d: 10,
  },
  {
    name: "Aline Pereira",
    phone: "+55 51 99222-3344",
    email: "aline.pereira@gmail.com",
    source: "WHATSAPP",
    status: "NEW",
    message: "Tem outras unidades disponíveis no prédio?",
    notes: null,
    d: 2,
  },
];

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Resolve a conta do corretor.
    let userRes = await client.query(
      'SELECT id, email, name FROM "user" WHERE email = $1 LIMIT 1',
      [targetEmail],
    );
    if (userRes.rowCount === 0) {
      userRes = await client.query(
        'SELECT id, email, name FROM "user" ORDER BY "createdAt" ASC LIMIT 1',
      );
    }
    if (userRes.rowCount === 0) {
      throw new Error("Nenhum usuário encontrado no banco.");
    }
    const user = userRes.rows[0];
    console.log(
      `👤 Usuário alvo: ${user.name ?? "(sem nome)"} <${user.email}>`,
    );

    // Remove mocks anteriores desta conta (idempotente, só toca em seedmock_*).
    const delBroker = await client.query(
      `DELETE FROM broker_leads WHERE "userId" = $1 AND id LIKE '${ID_PREFIX}%'`,
      [user.id],
    );
    const delLead = await client.query(
      `DELETE FROM leads WHERE "userId" = $1 AND id LIKE '${ID_PREFIX}%'`,
      [user.id],
    );
    console.log(
      `🧹 Mocks antigos removidos: ${delBroker.rowCount} corretor + ${delLead.rowCount} página de venda`,
    );

    if (cleanOnly) {
      console.log("✅ Limpeza concluída (--clean). Nada inserido.");
      return;
    }

    await client.query("BEGIN");

    // BrokerLeads
    for (const [i, l] of BROKER_LEADS.entries()) {
      await client.query(
        `INSERT INTO broker_leads (id, "userId", name, email, phone, message, source, status, notes, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          mockId(),
          user.id,
          l.name,
          l.email,
          l.phone,
          l.message,
          l.source,
          l.status,
          l.notes,
          daysAgo(l.d, i),
        ],
      );
    }

    // Sales-page leads — precisam de hotsites reais do usuário.
    const hotsitesRes = await client.query(
      'SELECT id, "listingId" FROM hotsites WHERE "userId" = $1',
      [user.id],
    );
    const hotsites = hotsitesRes.rows;
    let salesInserted = 0;

    if (hotsites.length === 0) {
      console.log(
        "ℹ️  Sem páginas de venda (hotsites) nesta conta — pulei os leads de página de venda. Os de corretor já bastam para ver o CRM.",
      );
    } else {
      for (const [i, l] of SALES_LEADS.entries()) {
        const h = hotsites[i % hotsites.length];
        await client.query(
          `INSERT INTO leads (id, "hotsiteId", "listingId", "userId", name, email, phone, message, source, status, notes, "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            mockId(),
            h.id,
            h.listingId,
            user.id,
            l.name,
            l.email,
            l.phone,
            l.message,
            l.source,
            l.status,
            l.notes,
            daysAgo(l.d, i),
          ],
        );
        salesInserted++;
      }
    }

    await client.query("COMMIT");

    console.log(
      `✅ Inseridos: ${BROKER_LEADS.length} leads de corretor + ${salesInserted} de página de venda.`,
    );
    console.log("   Abra /crm e o Painel para ver o funil populado.");
    console.log(
      `🧽 Para remover depois: node scripts/seed-leads.mjs --clean ${targetEmail}`,
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Falha no seed:", err.message);
  process.exit(1);
});
