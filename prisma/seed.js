// ============================================
// AGRICONNECT — DONNÉES DE TEST
// Lance avec: npm run db:seed
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Génération des données de test...\n');

  // ============================================
  // CATÉGORIES
  // ============================================
  const categories = await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-1' }, update: {}, create: { id: 'cat-1', name: 'Légumes', nameWolof: 'Légim', emoji: '🥬' } }),
    prisma.category.upsert({ where: { id: 'cat-2' }, update: {}, create: { id: 'cat-2', name: 'Fruits', nameWolof: 'Fruits bi', emoji: '🍊' } }),
    prisma.category.upsert({ where: { id: 'cat-3' }, update: {}, create: { id: 'cat-3', name: 'Céréales', nameWolof: 'Céréale', emoji: '🌾' } }),
    prisma.category.upsert({ where: { id: 'cat-4' }, update: {}, create: { id: 'cat-4', name: 'Tubercules', nameWolof: 'Tubercule', emoji: '🥔' } }),
    prisma.category.upsert({ where: { id: 'cat-5' }, update: {}, create: { id: 'cat-5', name: 'Légumineuses', nameWolof: 'Légumineuse', emoji: '🫘' } }),
    prisma.category.upsert({ where: { id: 'cat-6' }, update: {}, create: { id: 'cat-6', name: 'Épices', nameWolof: 'Epis', emoji: '🌶️' } }),
  ]);
  console.log(`✅ ${categories.length} catégories créées`);

  // ============================================
  // MOT DE PASSE COMMUN POUR LES TESTS
  // ============================================
  const hashedPassword = await bcrypt.hash('agriconnect123', 12);

  // ============================================
  // ADMIN
  // ============================================
  const admin = await prisma.user.upsert({
    where: { phone: '338200000' },
    update: {},
    create: {
      id: 'admin-1',
      phone: '338200000',
      email: 'admin@agriconnect.sn',
      passwordHash: hashedPassword,
      fullName: 'Admin AgriConnect',
      role: 'ADMIN',
      city: 'Dakar',
      region: 'Dakar',
      isVerified: true,
    }
  });
  console.log('✅ Admin créé:', admin.email);

  // ============================================
  // AGRICULTEURS
  // ============================================
  const farmersData = [
    { id: 'farmer-1', phone: '771234567', name: 'Mamadou Diallo', city: 'Kayar', region: 'Niayes', farm: 'Ferme Diallo', specialty: ['Légumes', 'Tomates'], rating: 4.9, sales: 127, certified: true },
    { id: 'farmer-2', phone: '762345678', name: 'Ibrahima Ba', city: 'Mboro', region: 'Thiès', farm: 'Exploitation Ba', specialty: ['Oignons', 'Légumes'], rating: 4.7, sales: 89, certified: true },
    { id: 'farmer-3', phone: '783456789', name: 'Aïssatou Diop', city: 'Ziguinchor', region: 'Casamance', farm: 'Verger Diop', specialty: ['Fruits', 'Mangues'], rating: 4.8, sales: 104, certified: false },
    { id: 'farmer-4', phone: '774567890', name: 'Ousmane Fall', city: 'Saint-Louis', region: 'Saint-Louis', farm: 'Rizières Fall', specialty: ['Céréales', 'Riz'], rating: 4.5, sales: 67, certified: false },
    { id: 'farmer-5', phone: '765678901', name: 'Cheikh Ndoye', city: 'Thiès', region: 'Thiès', farm: 'Maraîchage Ndoye', specialty: ['Légumes'], rating: 4.6, sales: 78, certified: true },
    { id: 'farmer-6', phone: '776789012', name: 'Fatou Sarr', city: 'Kaolack', region: 'Kaolack', farm: 'Jardin Sarr', specialty: ['Légumineuses', 'Arachides'], rating: 4.4, sales: 55, certified: false },
  ];

  for (const f of farmersData) {
    await prisma.user.upsert({
      where: { phone: f.phone },
      update: {},
      create: {
        id: f.id,
        phone: f.phone,
        email: `${f.name.toLowerCase().replace(' ', '.')}@agriconnect.sn`,
        passwordHash: hashedPassword,
        fullName: f.name,
        role: 'FARMER',
        city: f.city,
        region: f.region,
        isVerified: true,
        farmerProfile: {
          create: {
            farmName: f.farm,
            farmDescription: `Exploitation agricole familiale basée à ${f.city}. Spécialisée en ${f.specialty.join(', ')}.`,
            yearsExperience: Math.floor(Math.random() * 15) + 3,
            specialties: f.specialty,
            rating: f.rating,
            ratingCount: Math.floor(Math.random() * 100) + 20,
            totalSales: f.sales,
            isCertified: f.certified,
            acceptsDelivery: true,
            deliveryRadiusKm: 100,
          }
        }
      }
    });
  }
  console.log(`✅ ${farmersData.length} agriculteurs créés`);

  // ============================================
  // ACHETEURS
  // ============================================
  const buyersData = [
    { id: 'buyer-1', phone: '778901234', name: 'Fatou Mbaye', city: 'Dakar', email: 'fatou@gmail.com' },
    { id: 'buyer-2', phone: '769012345', name: 'Auchan Dakar', city: 'Dakar', email: 'achat@auchan.sn' },
    { id: 'buyer-3', phone: '770123456', name: 'Restaurant Lagon', city: 'Dakar', email: 'lagon@resto.sn' },
    { id: 'buyer-4', phone: '781234567', name: 'Moussa Ndiaye', city: 'Thiès', email: 'moussa@gmail.com' },
    { id: 'buyer-5', phone: '772345678', name: 'Hôtel Terrou-Bi', city: 'Dakar', email: 'achat@terrroubi.sn' },
  ];

  for (const b of buyersData) {
    await prisma.user.upsert({
      where: { phone: b.phone },
      update: {},
      create: {
        id: b.id,
        phone: b.phone,
        email: b.email,
        passwordHash: hashedPassword,
        fullName: b.name,
        role: 'BUYER',
        city: b.city,
        region: 'Dakar',
        isVerified: true,
      }
    });
  }
  console.log(`✅ ${buyersData.length} acheteurs créés`);

  // ============================================
  // PRODUITS
  // ============================================
  const productsData = [
    { id: 'prod-1', farmerId: 'farmer-1', categoryId: 'cat-1', name: 'Tomates Roma', price: 150, unit: 'kg', qty: 500, city: 'Kayar', region: 'Niayes', organic: false },
    { id: 'prod-2', farmerId: 'farmer-1', categoryId: 'cat-1', name: 'Salade verte', price: 75, unit: 'tête', qty: 200, city: 'Kayar', region: 'Niayes', organic: true },
    { id: 'prod-3', farmerId: 'farmer-1', categoryId: 'cat-1', name: 'Poivrons verts', price: 300, unit: 'kg', qty: 150, city: 'Kayar', region: 'Niayes', organic: false },
    { id: 'prod-4', farmerId: 'farmer-2', categoryId: 'cat-1', name: 'Oignons violets', price: 200, unit: 'kg', qty: 1000, city: 'Mboro', region: 'Thiès', organic: false },
    { id: 'prod-5', farmerId: 'farmer-2', categoryId: 'cat-1', name: 'Carottes fraîches', price: 250, unit: 'kg', qty: 300, city: 'Mboro', region: 'Thiès', organic: true },
    { id: 'prod-6', farmerId: 'farmer-3', categoryId: 'cat-2', name: 'Mangues Kent', price: 500, unit: 'kg', qty: 200, city: 'Ziguinchor', region: 'Casamance', organic: false },
    { id: 'prod-7', farmerId: 'farmer-3', categoryId: 'cat-2', name: 'Noix de cajou', price: 2500, unit: 'kg', qty: 100, city: 'Ziguinchor', region: 'Casamance', organic: true },
    { id: 'prod-8', farmerId: 'farmer-4', categoryId: 'cat-3', name: 'Riz local', price: 400, unit: 'kg', qty: 2000, city: 'Saint-Louis', region: 'Saint-Louis', organic: false },
    { id: 'prod-9', farmerId: 'farmer-4', categoryId: 'cat-3', name: 'Maïs frais', price: 100, unit: 'épi', qty: 500, city: 'Saint-Louis', region: 'Saint-Louis', organic: false },
    { id: 'prod-10', farmerId: 'farmer-5', categoryId: 'cat-1', name: 'Aubergines', price: 200, unit: 'kg', qty: 180, city: 'Thiès', region: 'Thiès', organic: false },
    { id: 'prod-11', farmerId: 'farmer-5', categoryId: 'cat-1', name: 'Gombo frais', price: 350, unit: 'kg', qty: 120, city: 'Thiès', region: 'Thiès', organic: true },
    { id: 'prod-12', farmerId: 'farmer-6', categoryId: 'cat-5', name: 'Arachides décortiquées', price: 800, unit: 'kg', qty: 500, city: 'Kaolack', region: 'Kaolack', organic: false },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        farmerId: p.farmerId,
        categoryId: p.categoryId,
        name: p.name,
        pricePerUnit: p.price,
        unit: p.unit,
        quantityAvailable: p.qty,
        isOrganic: p.organic,
        isAvailable: true,
        region: p.region,
        city: p.city,
        ordersCount: Math.floor(Math.random() * 50) + 5,
        viewsCount: Math.floor(Math.random() * 200) + 20,
      }
    });
  }
  console.log(`✅ ${productsData.length} produits créés`);

  // ============================================
  // COMMANDES
  // ============================================
  const ordersData = [
    { id: 'order-1', buyerId: 'buyer-1', farmerId: 'farmer-1', status: 'DELIVERED', payment: 'WAVE', total: 15200, commission: 1520 },
    { id: 'order-2', buyerId: 'buyer-2', farmerId: 'farmer-2', status: 'CONFIRMED', payment: 'WAVE', total: 125000, commission: 12500 },
    { id: 'order-3', buyerId: 'buyer-3', farmerId: 'farmer-1', status: 'DELIVERED', payment: 'ORANGE_MONEY', total: 87500, commission: 8750 },
    { id: 'order-4', buyerId: 'buyer-4', farmerId: 'farmer-3', status: 'PENDING', payment: 'CASH', total: 8750, commission: 875 },
    { id: 'order-5', buyerId: 'buyer-5', farmerId: 'farmer-2', status: 'PREPARING', payment: 'WAVE', total: 42000, commission: 4200 },
    { id: 'order-6', buyerId: 'buyer-1', farmerId: 'farmer-4', status: 'DELIVERED', payment: 'WAVE', total: 32000, commission: 3200 },
    { id: 'order-7', buyerId: 'buyer-2', farmerId: 'farmer-5', status: 'CANCELLED', payment: 'ORANGE_MONEY', total: 18500, commission: 0 },
    { id: 'order-8', buyerId: 'buyer-3', farmerId: 'farmer-6', status: 'READY', payment: 'CASH', total: 56000, commission: 5600 },
  ];

  for (const o of ordersData) {
    const subtotal = o.total - 700 - o.commission;
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        orderNumber: `AC${o.id.replace('order-', '').padStart(6, '0')}${Math.floor(Math.random() * 1000)}`,
        buyerId: o.buyerId,
        farmerId: o.farmerId,
        status: o.status,
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Dakar, Sénégal',
        subtotal: subtotal,
        deliveryFee: 700,
        platformCommission: o.commission,
        totalAmount: o.total,
        paymentMethod: o.payment,
        paymentStatus: o.status === 'DELIVERED' ? 'PAID' : o.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING',
        items: {
          create: [{
            productId: 'prod-1',
            productName: 'Tomates Roma',
            quantity: 10,
            unit: 'kg',
            unitPrice: 150,
            totalPrice: 1500,
          }]
        }
      }
    });
  }
  console.log(`✅ ${ordersData.length} commandes créées`);

  // ============================================
  // AVIS
  // ============================================
  await prisma.review.upsert({
    where: { orderId: 'order-1' },
    update: {},
    create: {
      orderId: 'order-1',
      reviewerId: 'buyer-1',
      reviewedId: 'farmer-1',
      rating: 5,
      comment: 'Produits excellents, très frais ! Livraison rapide. Je recommande vivement.',
    }
  });
  await prisma.review.upsert({
    where: { orderId: 'order-3' },
    update: {},
    create: {
      orderId: 'order-3',
      reviewerId: 'buyer-3',
      reviewedId: 'farmer-1',
      rating: 5,
      comment: 'Tomates de qualité exceptionnelle. Mamadou est très professionnel.',
    }
  });
  await prisma.review.upsert({
    where: { orderId: 'order-6' },
    update: {},
    create: {
      orderId: 'order-6',
      reviewerId: 'buyer-1',
      reviewedId: 'farmer-4',
      rating: 4,
      comment: 'Riz local de bonne qualité. Délai respecté.',
    }
  });
  console.log('✅ Avis créés');

  // ============================================
  // NOTIFICATIONS
  // ============================================
  await prisma.notification.createMany({
    data: [
      { userId: 'farmer-1', title: '🛒 Nouvelle commande !', body: 'Commande AC000001 — 15 200 FCFA', type: 'new_order', isRead: false },
      { userId: 'farmer-2', title: '🛒 Nouvelle commande !', body: 'Commande AC000002 — 125 000 FCFA', type: 'new_order', isRead: true },
      { userId: 'buyer-1', title: '✅ Commande confirmée !', body: 'Votre commande a été confirmée par Mamadou Diallo', type: 'order_update', isRead: false },
      { userId: 'admin-1', title: '👤 Nouvel agriculteur', body: 'Fatou Sarr vient de s\'inscrire', type: 'new_user', isRead: false },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Notifications créées');

  console.log('\n🎉 Base de données peuplée avec succès !');
  console.log('\n📋 Comptes de test :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin    : 338200000 / agriconnect123');
  console.log('👨‍🌾 Agriculteur : 771234567 / agriconnect123');
  console.log('🛒 Acheteur  : 778901234 / agriconnect123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
