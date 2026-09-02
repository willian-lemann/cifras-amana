export const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 7900,
    priceFormatted: "R$ 79",
    period: "/mês",
    description: "Para começar",
    features: [
      "Até 10 itens",
      "50 gerações de IA por mês",
      "Suporte por e-mail",
    ],
    limitations: [],
    cta: "Começar com Starter",
    popular: false,
  },
  {
    id: "professional",
    name: "Profissional",
    price: 22900,
    priceFormatted: "R$ 229",
    period: "/mês",
    description: "Tudo do Starter mais:",
    features: [
      "Itens ilimitados",
      "500 gerações de IA por mês",
      "Suporte prioritário",
    ],
    limitations: [],
    cta: "Começar com Profissional",
    popular: true,
  },
];
