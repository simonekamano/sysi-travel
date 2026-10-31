import { createServerFn } from "@tanstack/react-start";

export const getServerInfo = createServerFn({ method: "GET" }).handler(async () => ({
  renderedAt: new Date().toISOString(),
}));

export const listDestinations = createServerFn({ method: "GET" }).handler(({ context }) =>
  context.getBase44().entities.Destination.list("order", 200)
);

export const listFormules = createServerFn({ method: "GET" }).handler(({ context }) =>
  context.getBase44().entities.Formule.list("order", 50)
);

export const listFaqs = createServerFn({ method: "GET" }).handler(({ context }) =>
  context.getBase44().entities.Faq.list("order", 200)
);

export const getSiteContent = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const db = context.getBase44();
  const [destinations, formules, faqs] = await Promise.all([
    db.entities.Destination.list("order", 200),
    db.entities.Formule.list("order", 50),
    db.entities.Faq.list("order", 200),
  ]);
  return { destinations, formules, faqs };
});