import { PrismaClient, Role, UserStatus, RecurringFrequency, RecurringStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── App Config ──────────────────────────────────────────────────────────────
  await prisma.appConfig.upsert({
    where: { key: "whatsapp_number" },
    update: {},
    create: { key: "whatsapp_number", value: "5511999999999" },
  });
  await prisma.appConfig.upsert({
    where: { key: "store_address" },
    update: {},
    create: {
      key: "store_address",
      value: "Rua das Embalagens, 1000 - Distrito Industrial, São Paulo/SP",
    },
  });
  await prisma.appConfig.upsert({
    where: { key: "store_hours" },
    update: {},
    create: {
      key: "store_hours",
      value: "Segunda a Sexta: 8h às 18h | Sábado: 8h às 13h",
    },
  });

  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@atacadoembalagens.com.br" },
    update: {
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      role: Role.ADMIN,
    },
    create: {
      email: "admin@atacadoembalagens.com.br",
      password: hashedPassword,
      name: "Administrador",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // ── Demo client user ─────────────────────────────────────────────────────────
  const clientPassword = await bcrypt.hash("cliente123", 12);
  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@delivery.com.br" },
    update: {
      password: clientPassword,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "cliente@delivery.com.br",
      password: clientPassword,
      name: "Restaurante Sabor Caseiro",
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
      client: {
        create: {
          companyName: "Restaurante Sabor Caseiro LTDA",
          tradeName: "Sabor Caseiro",
          cnpj: "12.345.678/0001-90",
          representativeName: "João Silva",
          phone: "11987654321",
          whatsapp: "11987654321",
          addressStreet: "Rua das Flores",
          addressNumber: "123",
          addressNeighborhood: "Centro",
          addressCity: "São Paulo",
          addressState: "SP",
          addressZip: "01310-100",
          useSameAddress: true,
        },
      },
    },
  });
  console.log("✅ Cliente demo criado:", clientUser.email);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { name: "Isopor", slug: "isopor", icon: "🥡", sortOrder: 1 },
    { name: "Marmitas", slug: "marmitas", icon: "🍱", sortOrder: 2 },
    { name: "Potes", slug: "potes", icon: "🫙", sortOrder: 3 },
    { name: "Sacolas", slug: "sacolas", icon: "🛍️", sortOrder: 4 },
    { name: "Descartáveis", slug: "descartaveis", icon: "🥤", sortOrder: 5 },
    { name: "Outros", slug: "outros", icon: "📦", sortOrder: 6 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
    console.log("✅ Categoria:", created.name);
  }

  // ── Products ────────────────────────────────────────────────────────────────
  const products = [
    // Isopor
    {
      sku: "ISO-001",
      name: "Caixa de Isopor 5L",
      description: "Caixa de isopor para transporte de alimentos",
      dimensions: "22x18x14 cm",
      material: "EPS - Poliestireno Expandido",
      capacity: "5 litros",
      unitPrice: 3.5,
      packagePrice: 280.0,
      unitsPerPackage: 80,
      stock: 500,
      categoryId: createdCategories["isopor"],
    },
    {
      sku: "ISO-002",
      name: "Caixa de Isopor 12L",
      description: "Caixa de isopor grande para delivery de refeições",
      dimensions: "35x25x18 cm",
      material: "EPS - Poliestireno Expandido",
      capacity: "12 litros",
      unitPrice: 5.8,
      packagePrice: 348.0,
      unitsPerPackage: 60,
      stock: 300,
      categoryId: createdCategories["isopor"],
    },
    {
      sku: "ISO-003",
      name: "Bandeja de Isopor P (400g)",
      description: "Bandeja descartável para frutas e carnes",
      dimensions: "14x10x2 cm",
      material: "EPS",
      capacity: "400g",
      unitPrice: 0.25,
      packagePrice: 25.0,
      unitsPerPackage: 100,
      stock: 2000,
      categoryId: createdCategories["isopor"],
    },
    {
      sku: "ISO-004",
      name: "Bandeja de Isopor G (1kg)",
      description: "Bandeja descartável grande para carnes e frios",
      dimensions: "23x17x3 cm",
      material: "EPS",
      capacity: "1 kg",
      unitPrice: 0.45,
      packagePrice: 45.0,
      unitsPerPackage: 100,
      stock: 1500,
      categoryId: createdCategories["isopor"],
    },
    // Marmitas
    {
      sku: "MAR-001",
      name: "Marmitex Alumínio N°8",
      description: "Marmita de alumínio com tampa, ideal para quentinhas",
      dimensions: "22x15x6 cm",
      material: "Alumínio com verniz",
      capacity: "750 ml",
      unitPrice: 0.65,
      packagePrice: 65.0,
      unitsPerPackage: 100,
      stock: 3000,
      categoryId: createdCategories["marmitas"],
    },
    {
      sku: "MAR-002",
      name: "Marmitex Alumínio N°9",
      description: "Marmita de alumínio grande para porções generosas",
      dimensions: "24x18x6 cm",
      material: "Alumínio com verniz",
      capacity: "1000 ml",
      unitPrice: 0.85,
      packagePrice: 85.0,
      unitsPerPackage: 100,
      stock: 2500,
      categoryId: createdCategories["marmitas"],
    },
    {
      sku: "MAR-003",
      name: "Marmita Plástica 750ml com Tampa",
      description: "Marmita plástica transparente, microondável e laváveis",
      dimensions: "20x14x5 cm",
      material: "Polipropileno (PP)",
      capacity: "750 ml",
      unitPrice: 1.2,
      packagePrice: 60.0,
      unitsPerPackage: 50,
      stock: 1000,
      categoryId: createdCategories["marmitas"],
    },
    {
      sku: "MAR-004",
      name: "Marmita Plástica 1L com Tampa",
      description: "Marmita plástica 1 litro, ideal para delivery",
      dimensions: "22x16x6 cm",
      material: "Polipropileno (PP)",
      capacity: "1000 ml",
      unitPrice: 1.5,
      packagePrice: 75.0,
      unitsPerPackage: 50,
      stock: 800,
      categoryId: createdCategories["marmitas"],
    },
    // Potes
    {
      sku: "POT-001",
      name: "Pote Redondo 250ml com Tampa",
      description: "Pote para sobremesas, molhos e caldos",
      dimensions: "Ø 9x5 cm",
      material: "Polipropileno (PP)",
      capacity: "250 ml",
      unitPrice: 0.55,
      packagePrice: 27.5,
      unitsPerPackage: 50,
      stock: 2000,
      categoryId: createdCategories["potes"],
    },
    {
      sku: "POT-002",
      name: "Pote Redondo 500ml com Tampa",
      description: "Pote médio para caldos, açaí e sobremesas",
      dimensions: "Ø 11x7 cm",
      material: "Polipropileno (PP)",
      capacity: "500 ml",
      unitPrice: 0.75,
      packagePrice: 37.5,
      unitsPerPackage: 50,
      stock: 1500,
      categoryId: createdCategories["potes"],
    },
    {
      sku: "POT-003",
      name: "Pote Quadrado 1L com Tampa",
      description: "Pote quadrado para sopas, feijão e caldos",
      dimensions: "12x12x8 cm",
      material: "Polipropileno (PP)",
      capacity: "1000 ml",
      unitPrice: 1.1,
      packagePrice: 55.0,
      unitsPerPackage: 50,
      stock: 1000,
      categoryId: createdCategories["potes"],
    },
    // Sacolas
    {
      sku: "SAC-001",
      name: "Sacola Plástica 30x40cm (300 un)",
      description: "Sacola plástica resistente para delivery",
      dimensions: "30x40 cm",
      material: "PEAD",
      capacity: "Até 5 kg",
      unitPrice: 0.08,
      packagePrice: 24.0,
      unitsPerPackage: 300,
      stock: 5000,
      categoryId: createdCategories["sacolas"],
    },
    {
      sku: "SAC-002",
      name: "Sacola Kraft Papel 35x45cm (100 un)",
      description: "Sacola de papel kraft com alça, ideal para delivery premium",
      dimensions: "35x45 cm",
      material: "Papel Kraft",
      capacity: "Até 4 kg",
      unitPrice: 0.95,
      packagePrice: 95.0,
      unitsPerPackage: 100,
      stock: 800,
      categoryId: createdCategories["sacolas"],
    },
    // Descartáveis
    {
      sku: "DES-001",
      name: "Copo Descartável 200ml (100 un)",
      description: "Copo transparente para bebidas e sucos",
      dimensions: "Ø 7x9 cm",
      material: "PET",
      capacity: "200 ml",
      unitPrice: 0.12,
      packagePrice: 12.0,
      unitsPerPackage: 100,
      stock: 3000,
      categoryId: createdCategories["descartaveis"],
    },
    {
      sku: "DES-002",
      name: "Garfo + Faca + Guardanapo Kit (100 un)",
      description: "Kit de talheres descartáveis com guardanapo embalado",
      dimensions: "—",
      material: "Polipropileno",
      capacity: "—",
      unitPrice: 0.35,
      packagePrice: 35.0,
      unitsPerPackage: 100,
      stock: 2000,
      categoryId: createdCategories["descartaveis"],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        unitPrice: product.unitPrice,
        packagePrice: product.packagePrice,
      },
    });
    console.log("✅ Produto:", product.name);
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("─────────────────────────────────────────");
  console.log("👤 Admin: admin@atacadoembalagens.com.br / Admin@123");
  console.log("👤 Cliente demo: cliente@delivery.com.br / Cliente@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
