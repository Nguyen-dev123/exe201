require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const users = await User.find()
      .select(
        "email username displayName role subscriptionTier isLocked isBlocked createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`📊 Total users in database: ${users.length}\n`);

    console.log("👥 Recent Users:\n");
    console.log("=".repeat(100));
    console.log(
      "| ID                       | Email/Username              | Display Name      | Tier     | Role  | Status |",
    );
    console.log("=".repeat(100));

    users.forEach((user) => {
      const id = user._id.toString().substring(0, 24);
      const email = (user.email || user.username || "N/A")
        .substring(0, 27)
        .padEnd(27);
      const name = (user.displayName || "N/A").substring(0, 17).padEnd(17);
      const tier = (user.subscriptionTier || "FREE").padEnd(8);
      const role = (user.role || "USER").padEnd(5);
      const status = user.isLocked
        ? "LOCKED"
        : user.isBlocked
          ? "BLOCKED"
          : "ACTIVE";

      console.log(
        `| ${id} | ${email} | ${name} | ${tier} | ${role} | ${status.padEnd(6)} |`,
      );
    });

    console.log("=".repeat(100));

    // Count by tier
    const tierCounts = await User.aggregate([
      {
        $group: {
          _id: "$subscriptionTier",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📈 Users by Tier:");
    tierCounts.forEach((tier) => {
      console.log(`  - ${tier._id || "FREE"}: ${tier.count} users`);
    });

    // Check for duplicate emails/usernames
    const allUsers = await User.find().select("email username");
    const emails = {};
    const usernames = {};
    let duplicates = 0;

    allUsers.forEach((user) => {
      if (user.email) {
        emails[user.email] = (emails[user.email] || 0) + 1;
        if (emails[user.email] === 2) duplicates++;
      }
      if (user.username) {
        usernames[user.username] = (usernames[user.username] || 0) + 1;
        if (usernames[user.username] === 2) duplicates++;
      }
    });

    if (duplicates > 0) {
      console.log(`\n⚠️  Found ${duplicates} duplicate email(s)/username(s)`);
      Object.entries(emails).forEach(([email, count]) => {
        if (count > 1) console.log(`  - Email "${email}": ${count} users`);
      });
      Object.entries(usernames).forEach(([username, count]) => {
        if (count > 1)
          console.log(`  - Username "${username}": ${count} users`);
      });
    } else {
      console.log("\n✅ No duplicate emails/usernames found");
    }

    console.log("\n🔍 Test Account Suggestions:");
    console.log("  For testing multi-user features, create 2+ accounts:");
    console.log("  - user1@test.com (or any unique email)");
    console.log("  - user2@test.com (or any unique email)");
    console.log("  Make sure to use DIFFERENT emails for each test user!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

checkUsers();
