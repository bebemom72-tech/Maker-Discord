const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const config = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ================= DATA =================
let coins = require("./coins.json");
let projects = require("./projects.json");

// ================= SAVE =================
function saveCoins() {
    fs.writeFileSync("./coins.json", JSON.stringify(coins, null, 2));
}

function saveProjects() {
    fs.writeFileSync("./projects.json", JSON.stringify(projects, null, 2));
}

function getCoins(id) {
    if (!coins[id]) coins[id] = 0;
    return coins[id];
}

// ================= READY =================
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// ================= COMMANDS =================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(" ");
    const cmd = args.shift().toLowerCase();

    // 💰 رصيد
    if (cmd === "رصيدي") {
        return message.reply(`💰 رصيدك: ${getCoins(message.author.id)} Coin`);
    }

    // 🔁 تحويل
    if (cmd === "تحويل") {
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!user || !amount)
            return message.reply("❌ !تحويل @user عدد");

        if (getCoins(message.author.id) < amount)
            return message.reply("❌ رصيدك غير كافي");

        coins[message.author.id] -= amount;
        coins[user.id] = getCoins(user.id) + amount;

        saveCoins();

        return message.reply(`✅ تم تحويل ${amount} Coin إلى ${user}`);
    }

    // 🪙 شراء كوين (13k)
    if (cmd === "buy") {
        const amount = parseInt(args[0]);

        if (!amount)
            return message.reply("❌ !buy 200");

        const price = amount * 13000;

        return message.reply(
`💰 شراء Coins

🪙 الكمية: ${amount}
💳 السعر: ${price} Credit

\`\`\`c
1278355821020971127 ${price} Coins
\`\`\``
        );
    }

    // ➕ إضافة كوين (ميكر)
    if (cmd === "addcoins") {
        const user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!user || !amount)
            return message.reply("❌ !addcoins @user 100");

        coins[user.id] = getCoins(user.id) + amount;
        saveCoins();

        return message.reply(`💰 تم إضافة ${amount} Coin لـ ${user}`);
    }

    // 🏆 top
    if (cmd === "top") {
        const sorted = Object.entries(coins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let text = "🏆 أفضل 10 أعضاء:\n\n";

        sorted.forEach((u, i) => {
            text += `#${i + 1} <@${u[0]}> ➜ ${u[1]} Coin\n`;
        });

        return message.reply(text);
    }

    // 📦 إضافة مشروع (ميكر)
    if (cmd === "addproject") {
        const name = args[0];
        const price = parseInt(args[1]);
        const link = args.slice(2).join(" ");

        if (!name || !price || !link)
            return message.reply("❌ !addproject name price link");

        projects.push({ name, price, link });
        saveProjects();

        return message.reply("✅ تم إضافة المشروع");
    }

    // 📦 عرض المشاريع
    if (cmd === "projects") {
        if (projects.length === 0)
            return message.reply("❌ لا يوجد بروجكتات متوفرة");

        let text = "📦 بروجكتات متوفرة:\n\n";

        projects.forEach((p, i) => {
            text += `#${i + 1} 🧑‍💻 ${p.name}\n💰 ${p.price} Coin\n🔗 ${p.link}\n\n`;
        });

        return message.reply(text);
    }

    // 🛒 شراء مشروع
    if (cmd === "buyproject") {
        const name = args.join(" ");

        const project = projects.find(p => p.name === name);

        if (!project)
            return message.reply("❌ المشروع غير موجود");

        if (getCoins(message.author.id) < project.price)
            return message.reply("❌ رصيدك غير كافي");

        coins[message.author.id] -= project.price;
        saveCoins();

        return message.reply(
`✅ تم شراء: ${project.name}

🔗 ${project.link}`
        );
    }

    // 📢 برودكاست + تقرير
    if (cmd === "bc") {
        const msg = args.join(" ");

        if (!msg)
            return message.reply("❌ !bc message");

        const members = await message.guild.members.fetch();

        let success = 0;
        let fail = 0;

        await Promise.all(
            members.map(async (m) => {
                if (m.user.bot) return;

                try {
                    await m.send(`📢 إعلان:\n\n${msg}`);
                    success++;
                } catch {
                    fail++;
                }
            })
        );

        return message.reply(
`📢 تم إرسال البرودكاست

✅ تم الإرسال: ${success}
❌ فشل الإرسال: ${fail}`
        );
    }

    // 📌 help
    if (cmd === "help") {
        return message.reply(`
📌 أوامر البوت:

💰 Coins:
!رصيدي
!تحويل @user عدد
!buy عدد
!addcoins @user عدد

🏆 Top:
!top

📦 مشاريع:
!projects
!addproject name price link
!buyproject name

📢 Broadcast:
!bc message
        `);
    }
});

// ================= LOGIN =================
client.login(config.token);
