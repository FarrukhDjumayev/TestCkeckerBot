import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";

const bot = new Telegraf("7609992963:AAHOY8dsxkpkWLaHFfTuecypmVMO34ZYYgE"); // tokeningizni shu yerga yozing
const ADMIN_ID = 991729905; // o'zingizning telegram ID raqamingizni yozing

const testsDir = path.resolve("./tests");

// Foydalanuvchining holatini saqlash (qaysi testni yechmoqda)
const userState = new Map();

// Admin uchun faqat komandalar
function adminOnly(ctx, next) {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("❌ Sizda bu komandani ishlatish uchun ruxsat yo‘q.");
  }
  return next();
}

// /add test-nomi kalitlar — test qo‘shish
bot.command("add", adminOnly, (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(" ");

  if (parts.length !== 3) {
    return ctx.reply(
      "❌ Xato format! To‘g‘ri format:\n/add test-nomi kalitlar\nMasalan:\n/add 114-test aabbaaddccaabdabdcabd"
    );
  }

  const testName = parts[1];
  const answers = parts[2].toLowerCase();

  // Faqat a,b,c,d harflari va uzunlik tekshir
  if (!/^[abcd]+$/.test(answers)) {
    return ctx.reply("❌ Javoblar faqat a,b,c,d harflaridan iborat bo‘lishi kerak.");
  }

  // Tests papkasi borligini tekshir, yo'q bo'lsa yarat
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }

  const testFile = path.join(testsDir, `${testName}.json`);

  const testData = {
    title: testName,
    answers: answers,
  };

  fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), "utf-8");

  return ctx.reply(`✅ Test "${testName}" muvaffaqiyatli qo‘shildi!`);
});

// Foydalanuvchi test nomini yozganda
bot.on("text", (ctx) => {
  const text = ctx.message.text.trim().toLowerCase();

  // Agar foydalanuvchi test kalitlarini yuborayotgan bo‘lsa
  if (userState.has(ctx.from.id)) {
    const { testName, correctAnswers } = userState.get(ctx.from.id);
    const userAnswers = text;

    // Javoblar faqat a,b,c,d dan iborat bo‘lishi kerak
    if (!/^[abcd]+$/.test(userAnswers)) {
      return ctx.reply("❌ Javoblaringiz faqat a,b,c,d harflaridan iborat bo‘lishi kerak. Qaytadan yuboring.");
    }

    if (userAnswers.length !== correctAnswers.length) {
      return ctx.reply(
        `❌ Javoblaringiz soni noto‘g‘ri. Testda ${correctAnswers.length} ta savol bor, siz ${userAnswers.length} ta javob yubordingiz.`
      );
    }

    // Tekshirish
    let correctCount = 0;
    let resultStr = "";
    for (let i = 0; i < correctAnswers.length; i++) {
      if (userAnswers[i] === correctAnswers[i]) {
        correctCount++;
        resultStr += "✅";
      } else {
        resultStr += "❌";
      }
    }

    ctx.reply(
      `📝 Natijangiz: ${correctCount} ta to‘g‘ri / ${correctAnswers.length} ta savol\nNatija:\n${resultStr}`
    );

    userState.delete(ctx.from.id);
    return;
  }

  // Agar foydalanuvchi test nomini yozgan bo‘lsa, testni yuklab olish va javob so‘rash
  const testFile = path.join(testsDir, `${text}.json`);

  if (fs.existsSync(testFile)) {
    const testData = JSON.parse(fs.readFileSync(testFile, "utf-8"));

    userState.set(ctx.from.id, {
      testName: testData.title,
      correctAnswers: testData.answers,
    });

    return ctx.reply(
      `📝 Siz "${testData.title}" testini tanladingiz. Iltimos, javoblaringizni a,b,c,d harflaridan iborat qilib yuboring.\nMasalan: aabbaaddccaabdabdcabd`
    );
  }

  // Agar test topilmasa
  ctx.reply("❌ Bunday test topilmadi. Iltimos, test nomini tekshiring.");
});

// Botni ishga tushurish
bot.launch();

console.log("Bot ishga tushdi...");
