import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default categories
  const categories = [
    { name: "IPTV Providers", slug: "iptv-providers", description: "Reviews, comparisons, and discussions of IPTV service providers", icon: "Tv", color: "#00d4ff", sortOrder: 1 },
    { name: "Add-ons & Apps", slug: "addons-apps", description: "Kodi, Tivimate, IPTV Smarters, Perfect Player, GSE and more", icon: "Puzzle", color: "#a855f7", sortOrder: 2 },
    { name: "M3U / Playlists", slug: "m3u-playlists", description: "Share and discover IPTV playlists and M3U links", icon: "List", color: "#06b6d4", sortOrder: 3 },
    { name: "EPG & Channel Guides", slug: "epg-guides", description: "Electronic Programme Guide sources, channel lineups, and XMLTV", icon: "Calendar", color: "#10b981", sortOrder: 4 },
    { name: "Tutorials & Guides", slug: "tutorials", description: "Step-by-step setup guides, tips and tricks for IPTV", icon: "BookOpen", color: "#f59e0b", sortOrder: 5 },
    { name: "General Discussion", slug: "general", description: "General IPTV chat, news, and community discussion", icon: "MessageSquare", color: "#ec4899", sortOrder: 6 },
    { name: "Off-Topic", slug: "off-topic", description: "Everything else — movies, tech, gaming, and more", icon: "Hash", color: "#475569", sortOrder: 7 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Add-ons subcategories
  const addonsCategory = await prisma.category.findUnique({ where: { slug: "addons-apps" } });
  if (addonsCategory) {
    const subcategories = [
      { name: "Kodi", slug: "kodi", description: "Kodi add-ons, builds, and configuration", icon: "Box", color: "#a855f7", sortOrder: 1, parentId: addonsCategory.id },
      { name: "Tivimate", slug: "tivimate", description: "Tivimate IPTV Player setup and tips", icon: "Play", color: "#a855f7", sortOrder: 2, parentId: addonsCategory.id },
      { name: "IPTV Smarters", slug: "iptv-smarters", description: "IPTV Smarters Pro discussion and support", icon: "Zap", color: "#a855f7", sortOrder: 3, parentId: addonsCategory.id },
      { name: "Perfect Player", slug: "perfect-player", description: "Perfect Player IPTV setup and support", icon: "Star", color: "#a855f7", sortOrder: 4, parentId: addonsCategory.id },
    ];
    for (const sub of subcategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: sub,
      });
    }
  }

  // Default badges
  const badges = [
    { name: "First Post", description: "Made your first post on StreamZone", icon: "MessageSquare", color: "#00d4ff", requirement: "Post 1 time" },
    { name: "Thread Starter", description: "Created your first thread", icon: "PlusCircle", color: "#a855f7", requirement: "Create 1 thread" },
    { name: "Regular", description: "Active community member", icon: "Users", color: "#06b6d4", requirement: "500 reputation points" },
    { name: "Veteran", description: "Long-standing community veteran", icon: "Shield", color: "#f59e0b", requirement: "2000 reputation points" },
    { name: "Legend", description: "Legendary StreamZone contributor", icon: "Crown", color: "#ec4899", requirement: "5000 reputation points" },
    { name: "Helpful", description: "Received 10 helpful reactions", icon: "ThumbsUp", color: "#10b981", requirement: "10 helpful reactions" },
    { name: "Playlist Pro", description: "Submitted 5 valid playlists", icon: "List", color: "#00d4ff", requirement: "5 valid playlists submitted" },
    { name: "Reviewer", description: "Reviewed 3 IPTV providers", icon: "Star", color: "#f59e0b", requirement: "3 provider reviews" },
    { name: "Trusted", description: "Trusted and verified community member", icon: "CheckCircle", color: "#10b981", requirement: "2000 rep + 6 months membership" },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  // Default site settings
  const settings = [
    { key: "site_name", value: "StreamZone" },
    { key: "site_tagline", value: "The Ultimate IPTV Community" },
    { key: "registration_open", value: "true" },
    { key: "maintenance_mode", value: "false" },
    { key: "require_email_verification", value: "true" },
    { key: "max_upload_size_mb", value: "5" },
    { key: "posts_per_page", value: "20" },
    { key: "threads_per_page", value: "25" },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Default admin user
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@streamzone.local" } });
  if (!adminExists) {
    const hashedPw = await bcrypt.hash("StreamZone@Admin1!", 12);
    const admin = await prisma.user.create({
      data: {
        email: "admin@streamzone.local",
        username: "admin",
        name: "StreamZone Admin",
        passwordHash: hashedPw,
        emailVerified: new Date(),
        role: "ADMIN",
        profile: {
          create: {
            bio: "StreamZone administrator",
            customTitle: "Site Admin",
            reputation: 9999,
            level: 5,
          },
        },
      },
    });
    console.log(`Created admin user: ${admin.email} / StreamZone@Admin1!`);
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
