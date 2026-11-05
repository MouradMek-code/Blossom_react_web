// The privacy policy in the four site languages (pages/PrivacyPolicy.jsx).
// Each section is a title and blocks: a string is a paragraph, an array a
// bulleted list. In the text, **...** is bold, {support} / {contact} are the
// emails, {safety} the support email with a "Child Safety Report" subject,
// {deletePage} the link to /delete-account, {reportPage} the link to /report
// and {childSafety} the link to the child safety standards page.
// Keep the four versions saying the same thing.

export const PRIVACY_POLICY = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: November 5, 2026",
    sections: [
      {
        blocks: [
          'Blossom ("we", "us", "our") operates the Blossom dating application (the "Service"), available on the web and as an Android app. This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
        ],
      },
      {
        title: "Information We Collect",
        blocks: [
          "**Account information:** username, email address, phone number, password (stored as a one-way hash, never in plain text), and date of birth (used only to confirm you are 18 or older).",
          "**Profile information:** bio, age, gender, sexual orientation, height, occupation, education, lifestyle preferences, relationship goals, languages, city/country, and any photos you upload.",
          "**Usage information:** likes, matches, messages you send to other users, events you create or join and their comments, places you save or suggest, and any blocks or reports you submit.",
          "**Verification selfie (optional):** if you ask for the ✓ verified badge, you take a selfie copying a pose. Only the Blossom team sees it, to compare it with your photos, and it is deleted as soon as it has been checked; only the result (verified or not) is kept.",
          "**Approximate location (optional):** if you allow it, the Blossom app or website reads your approximate location (never your precise position) to keep the city and country on your profile up to date, and to check that Blossom is available where you are; in a country where it isn't, the account is removed. Only the resulting city and country are stored; the position itself is not kept. You can refuse in the permission window, or turn this off at any time in the app's Settings or your phone's settings.",
          "**Device time zone:** when you create your profile, the app or website sends your device's time zone (for example Europe/Paris) to check that Blossom is available in your country. It is not stored.",
          "**Notifications (app, optional):** if you allow notifications, we store a notification token for your phone and your app language, so we can tell you about new likes, matches and messages.",
          "**Visits:** when you open the app or the website, we note the visit - a random identifier of your device or browser, the platform (app or web), language, time zone and the pages or screens seen - to count our visitors. No IP address is stored, and these records only cover the current week: they are deleted every Monday.",
          "**Reports and feedback:** what you send us with “Report a problem” and, if you are not logged in, the email address you choose to give us so we can answer you.",
          "**Businesses:** if you send a partner request or a message for a café, restaurant or other venue, we keep the venue's details and your name, email and phone number to answer you and manage your promotions.",
          "We do not knowingly collect any information from anyone under 18. Signup is blocked for anyone who does not confirm a date of birth indicating they are 18 or older.",
        ],
      },
      {
        title: "How We Use Your Information",
        blocks: [
          [
            "To create and operate your account",
            "To show your profile to other users and suggest matches",
            "To deliver messages between matched users",
            "To send verification codes (signup, password reset) by email",
            "To send the notifications you allowed (new likes, matches and messages)",
            "To check that Blossom is available in your country",
            "To count our visitors and improve Blossom (visit records, deleted every week)",
            "To keep Blossom safe - checking verification selfies, reviewing reports and blocks, and removing fake, scam or rule-breaking accounts",
          ],
        ],
      },
      {
        title: "Sharing With Third Parties",
        blocks: [
          "We use the following service providers to operate Blossom. They process data only as needed to provide their service to us:",
          [
            "**Cloudinary** - stores and serves the photos you upload (and verification selfies until they are checked)",
            "**Brevo** - sends verification, password-reset and other service emails",
            "**Expo and Google Firebase Cloud Messaging** - deliver the app's notifications",
            "**OpenStreetMap (Nominatim)** - on the website, finds the city from a position rounded to about a kilometre",
            "**Render** - hosts our backend server and database",
          ],
          "We do not sell your personal information to anyone.",
        ],
      },
      {
        title: "Other Users Can See",
        blocks: [
          "Your profile (photos, bio, the details you fill in, and your city and country), the ✓ badge if you are verified, and any messages you send to a match. Your email, phone number, password, position and verification selfie are never shown to other users.",
        ],
      },
      {
        title: "Blocking and Reporting",
        blocks: [
          "You can block another user at any time from their profile - once blocked, neither of you will see the other in Browse, Likes, or Matches, and you can no longer message each other. You can also report a profile for inappropriate behavior; reports are reviewed and may result in the reported account being removed.",
          "To tell us about any other problem - a safety concern, a scam, a bug - use “Report a problem” in the app's Settings, or {reportPage}, without leaving Blossom.",
          "When a message in a chat mentions money or moving to another app, a safety tip appears. This check runs on your device only: your messages are not scanned on our servers for it.",
        ],
      },
      {
        title: "Child Safety",
        blocks: [
          "Blossom is strictly for adults aged 18 and older. We do not knowingly allow minors to create accounts, and age is verified at signup via date of birth.",
          "Blossom has **zero tolerance** for child sexual abuse material (CSAM) or any form of child sexual exploitation. Any account found to be involved in such activity is immediately banned and reported to the National Center for Missing & Exploited Children (NCMEC) and/or relevant law enforcement authorities.",
          "You can report a profile for any reason, including suspected child safety violations, directly from that profile using the **Report** button, or with “Report a problem” → “Child safety concern”. You can also report concerns directly to our designated point of contact at {safety} (or {contact}). We review and act on all reports, including removing violating accounts and content. Our full child safety standards: {childSafety}.",
        ],
      },
      {
        title: "Data Retention & Deletion",
        blocks: [
          'You can permanently delete your account at any time: in the app, Settings → "Delete account" (at the bottom of the page); on the website, Settings → Delete account. You can also request deletion without logging in at {deletePage}. Deleting your account removes your profile, photos, bio, matches, likes, and all messages you\'ve sent. This action cannot be undone. Reports you sent us may be kept to keep Blossom safe.',
          "Some data is deleted automatically: accounts that still have no photo one hour after their profile was created, and accounts that never finish their profile; accounts in a country where Blossom isn't available; verification selfies once checked; visit records every week; email verification codes once used or expired.",
          'Only want a pause? "Take a break" in the app\'s Settings hides your profile from Browse without deleting anything.',
        ],
      },
      {
        title: "Security",
        blocks: [
          "Passwords are hashed before storage and are never stored or transmitted in plain text. Access to the app is authenticated using signed tokens that expire automatically.",
        ],
      },
      {
        title: "Changes to This Policy",
        blocks: [
          "We may update this policy from time to time. Continued use of Blossom after a change means you accept the updated policy.",
        ],
      },
      {
        title: "Contact Us",
        blocks: [
          "Questions about this policy or your data? Email our support at {support}. You can also reach us at {contact}.",
        ],
      },
    ],
  },

  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 5 novembre 2026",
    sections: [
      {
        blocks: [
          "Blossom (« nous », « notre ») exploite l'application de rencontre Blossom (le « Service »), disponible sur le web et en application Android. Cette politique de confidentialité explique quelles informations nous collectons, comment nous les utilisons et les choix dont vous disposez.",
        ],
      },
      {
        title: "Informations que nous collectons",
        blocks: [
          "**Informations du compte :** nom d'utilisateur, adresse e-mail, numéro de téléphone, mot de passe (enregistré sous forme de hachage irréversible, jamais en clair) et date de naissance (utilisée uniquement pour confirmer que vous avez 18 ans ou plus).",
          "**Informations du profil :** bio, âge, genre, orientation sexuelle, taille, profession, études, habitudes de vie, objectifs amoureux, langues, ville/pays et les photos que vous ajoutez.",
          "**Informations d'utilisation :** likes, matchs, messages envoyés aux autres membres, événements que vous créez ou rejoignez et leurs commentaires, lieux que vous enregistrez ou proposez, ainsi que les blocages et signalements que vous effectuez.",
          "**Selfie de vérification (facultatif) :** si vous demandez le badge ✓ vérifié, vous prenez un selfie en reproduisant une pose. Seule l'équipe Blossom le voit, pour le comparer à vos photos, et il est supprimé dès qu'il a été vérifié ; seul le résultat (vérifié ou non) est conservé.",
          "**Position approximative (facultatif) :** si vous l'autorisez, l'application ou le site Blossom lit votre position approximative (jamais votre position précise) pour garder à jour la ville et le pays de votre profil, et vérifier que Blossom est disponible là où vous êtes ; dans un pays où il ne l'est pas, le compte est supprimé. Seuls la ville et le pays obtenus sont enregistrés ; la position elle-même n'est pas conservée. Vous pouvez refuser dans la fenêtre d'autorisation, ou désactiver cette option à tout moment dans les Réglages de l'application ou de votre téléphone.",
          "**Fuseau horaire de l'appareil :** à la création de votre profil, l'application ou le site envoie le fuseau horaire de votre appareil (par exemple Europe/Paris) pour vérifier que Blossom est disponible dans votre pays. Il n'est pas enregistré.",
          "**Notifications (application, facultatif) :** si vous autorisez les notifications, nous enregistrons un identifiant de notification pour votre téléphone ainsi que la langue de l'application, afin de vous prévenir des nouveaux likes, matchs et messages.",
          "**Visites :** quand vous ouvrez l'application ou le site, nous notons la visite - un identifiant aléatoire de votre appareil ou navigateur, la plateforme (application ou web), la langue, le fuseau horaire et les pages ou écrans vus - pour compter nos visiteurs. Aucune adresse IP n'est enregistrée, et ces données ne couvrent que la semaine en cours : elles sont supprimées chaque lundi.",
          "**Signalements et retours :** ce que vous nous envoyez avec « Signaler un problème » et, si vous n'êtes pas connecté(e), l'adresse e-mail que vous choisissez de nous donner pour que nous puissions vous répondre.",
          "**Établissements :** si vous envoyez une demande de partenariat ou un message pour un café, un restaurant ou un autre lieu, nous conservons les informations du lieu ainsi que votre nom, e-mail et numéro de téléphone pour vous répondre et gérer vos promotions.",
          "Nous ne collectons sciemment aucune information auprès de personnes de moins de 18 ans. L'inscription est bloquée pour toute personne qui ne confirme pas une date de naissance indiquant qu'elle a 18 ans ou plus.",
        ],
      },
      {
        title: "Comment nous utilisons vos informations",
        blocks: [
          [
            "Pour créer et faire fonctionner votre compte",
            "Pour montrer votre profil aux autres membres et proposer des matchs",
            "Pour transmettre les messages entre membres qui ont matché",
            "Pour envoyer les codes de vérification (inscription, réinitialisation du mot de passe) par e-mail",
            "Pour envoyer les notifications que vous avez autorisées (nouveaux likes, matchs et messages)",
            "Pour vérifier que Blossom est disponible dans votre pays",
            "Pour compter nos visiteurs et améliorer Blossom (données de visite, supprimées chaque semaine)",
            "Pour garder Blossom sûr : vérifier les selfies de vérification, examiner les signalements et blocages, et supprimer les comptes faux, frauduleux ou qui enfreignent nos règles",
          ],
        ],
      },
      {
        title: "Partage avec des tiers",
        blocks: [
          "Nous faisons appel aux prestataires suivants pour faire fonctionner Blossom. Ils ne traitent les données que dans la mesure nécessaire pour nous fournir leur service :",
          [
            "**Cloudinary** : stocke et affiche les photos que vous ajoutez (et les selfies de vérification jusqu'à leur vérification)",
            "**Brevo** : envoie les e-mails de vérification, de réinitialisation du mot de passe et autres e-mails du service",
            "**Expo et Google Firebase Cloud Messaging** : envoient les notifications de l'application",
            "**OpenStreetMap (Nominatim)** : sur le site, trouve la ville à partir d'une position arrondie à environ un kilomètre",
            "**Render** : héberge notre serveur et notre base de données",
          ],
          "Nous ne vendons vos informations personnelles à personne.",
        ],
      },
      {
        title: "Ce que les autres membres peuvent voir",
        blocks: [
          "Votre profil (photos, bio, les informations que vous renseignez, ainsi que votre ville et votre pays), le badge ✓ si vous êtes vérifié(e), et les messages que vous envoyez à un match. Votre e-mail, votre numéro de téléphone, votre mot de passe, votre position et votre selfie de vérification ne sont jamais montrés aux autres membres.",
        ],
      },
      {
        title: "Blocage et signalement",
        blocks: [
          "Vous pouvez bloquer un autre membre à tout moment depuis son profil : une fois bloqué, aucun de vous deux ne verra l'autre dans Explorer, les Likes ou les Matchs, et vous ne pourrez plus vous écrire. Vous pouvez aussi signaler un profil pour comportement inapproprié ; les signalements sont examinés et peuvent entraîner la suppression du compte signalé.",
          "Pour nous signaler tout autre problème - un souci de sécurité, une arnaque, un bug - utilisez « Signaler un problème » dans les Réglages de l'application, ou {reportPage}, sans quitter Blossom.",
          "Quand un message dans une discussion parle d'argent ou de passer sur une autre application, un conseil de sécurité s'affiche. Cette vérification se fait uniquement sur votre appareil : vos messages ne sont pas analysés sur nos serveurs pour cela.",
        ],
      },
      {
        title: "Protection des enfants",
        blocks: [
          "Blossom est strictement réservé aux adultes de 18 ans et plus. Nous n'autorisons pas sciemment les mineurs à créer un compte, et l'âge est vérifié à l'inscription grâce à la date de naissance.",
          "Blossom applique une **tolérance zéro** envers les contenus d'abus sexuels sur mineurs (CSAM) et toute forme d'exploitation sexuelle d'enfants. Tout compte impliqué dans une telle activité est immédiatement banni et signalé au National Center for Missing & Exploited Children (NCMEC) et/ou aux autorités compétentes.",
          "Vous pouvez signaler un profil pour n'importe quelle raison, y compris une suspicion d'atteinte à la sécurité des enfants, directement depuis ce profil avec le bouton **Signaler**, ou avec « Signaler un problème » → « Sécurité d'un enfant ». Vous pouvez aussi signaler vos inquiétudes à notre point de contact désigné : {safety} (ou {contact}). Nous examinons tous les signalements et agissons en conséquence, notamment en supprimant les comptes et contenus en infraction. Nos normes complètes de protection des enfants : {childSafety}.",
        ],
      },
      {
        title: "Conservation et suppression des données",
        blocks: [
          "Vous pouvez supprimer définitivement votre compte à tout moment : dans l'application, Réglages → « Supprimer le compte » (en bas de la page) ; sur le site, Réglages → Supprimer le compte. Vous pouvez aussi demander la suppression sans vous connecter sur {deletePage}. La suppression retire votre profil, vos photos, votre bio, vos matchs, vos likes et tous les messages que vous avez envoyés. Cette action est irréversible. Les signalements que vous nous avez envoyés peuvent être conservés pour garder Blossom sûr.",
          "Certaines données sont supprimées automatiquement : les comptes qui n'ont toujours aucune photo une heure après la création du profil, et ceux qui ne terminent jamais leur profil ; les comptes situés dans un pays où Blossom n'est pas disponible ; les selfies de vérification une fois vérifiés ; les données de visite chaque semaine ; les codes de vérification par e-mail une fois utilisés ou expirés.",
          "Vous voulez seulement une pause ? « Faire une pause » dans les Réglages de l'application masque votre profil dans Explorer sans rien supprimer.",
        ],
      },
      {
        title: "Sécurité",
        blocks: [
          "Les mots de passe sont hachés avant d'être enregistrés et ne sont jamais stockés ni transmis en clair. L'accès à l'application est protégé par des jetons signés qui expirent automatiquement.",
        ],
      },
      {
        title: "Modifications de cette politique",
        blocks: [
          "Nous pouvons mettre à jour cette politique de temps en temps. Continuer à utiliser Blossom après une modification signifie que vous acceptez la politique mise à jour.",
        ],
      },
      {
        title: "Nous contacter",
        blocks: [
          "Une question sur cette politique ou sur vos données ? Écrivez à notre support : {support}. Vous pouvez aussi nous joindre à {contact}.",
        ],
      },
    ],
  },

  zh: {
    title: "隐私政策",
    updated: "最后更新：2026年11月5日",
    sections: [
      {
        blocks: [
          "Blossom（“我们”）运营 Blossom 约会应用（“本服务”），提供网页版和 Android 应用。本隐私政策说明我们收集哪些信息、如何使用这些信息，以及你拥有的选择。",
        ],
      },
      {
        title: "我们收集的信息",
        blocks: [
          "**账户信息：**用户名、电子邮箱、电话号码、密码（以单向哈希形式保存，绝不以明文存储）以及出生日期（仅用于确认你已年满 18 岁）。",
          "**资料信息：**个人简介、年龄、性别、性取向、身高、职业、教育程度、生活习惯、恋爱目标、语言、城市/国家，以及你上传的照片。",
          "**使用信息：**喜欢、配对、你发送给其他用户的消息、你创建或参加的活动及其评论、你收藏或推荐的地点，以及你提交的屏蔽和举报。",
          "**认证自拍（可选）：**如果你申请 ✓ 认证标志，需要模仿一个姿势拍一张自拍。只有 Blossom 团队会看到它，用来和你的照片比对；审核完成后立即删除，只保留结果（是否通过认证）。",
          "**大致位置（可选）：**如果你允许，Blossom 应用或网站会读取你的大致位置（绝不读取精确位置），以保持你资料中的城市和国家为最新，并确认 Blossom 在你所在地区可用；如果当地未开放，账户将被删除。我们只保存得出的城市和国家，不保存位置本身。你可以在授权窗口中拒绝，也可以随时在应用设置或手机设置中关闭此功能。",
          "**设备时区：**创建资料时，应用或网站会发送你设备的时区（例如 Europe/Paris），以确认 Blossom 在你所在的国家可用。时区不会被保存。",
          "**通知（应用，可选）：**如果你允许通知，我们会保存你手机的通知令牌和应用语言，以便告诉你新的喜欢、配对和消息。",
          "**访问记录：**当你打开应用或网站时，我们会记录这次访问——你设备或浏览器的随机标识、平台（应用或网页）、语言、时区以及浏览过的页面或界面——用于统计访客数量。我们不保存 IP 地址，这些记录只保留本周的数据：每周一都会被删除。",
          "**举报和反馈：**你通过“反馈问题”发送给我们的内容；如果你未登录，还包括你自愿留下、方便我们回复的电子邮箱。",
          "**商家：**如果你为咖啡馆、餐厅或其他场所提交合作申请或留言，我们会保存场所信息以及你的姓名、邮箱和电话号码，用于回复你并管理你的优惠活动。",
          "我们不会故意收集未满 18 岁人士的任何信息。未确认出生日期显示已年满 18 岁的人无法注册。",
        ],
      },
      {
        title: "我们如何使用你的信息",
        blocks: [
          [
            "创建并运营你的账户",
            "向其他用户展示你的资料并推荐配对",
            "在已配对的用户之间传递消息",
            "通过电子邮件发送验证码（注册、重置密码）",
            "发送你允许的通知（新的喜欢、配对和消息）",
            "确认 Blossom 在你所在的国家可用",
            "统计访客数量并改进 Blossom（访问记录每周删除）",
            "保障 Blossom 的安全：审核认证自拍、处理举报和屏蔽，并删除虚假、诈骗或违反规则的账户",
          ],
        ],
      },
      {
        title: "与第三方共享",
        blocks: [
          "我们使用以下服务商来运营 Blossom。他们仅在为我们提供服务所需的范围内处理数据：",
          [
            "**Cloudinary**：存储并展示你上传的照片（以及审核完成前的认证自拍）",
            "**Brevo**：发送验证、重置密码及其他服务邮件",
            "**Expo 和 Google Firebase Cloud Messaging**：发送应用通知",
            "**OpenStreetMap（Nominatim）**：在网站上，根据精确到约一公里的位置查找城市",
            "**Render**：托管我们的后端服务器和数据库",
          ],
          "我们绝不出售你的个人信息。",
        ],
      },
      {
        title: "其他用户可以看到的内容",
        blocks: [
          "你的资料（照片、简介、你填写的信息以及你的城市和国家）、你通过认证后的 ✓ 标志，以及你发给配对对象的消息。你的电子邮箱、电话号码、密码、位置和认证自拍绝不会展示给其他用户。",
        ],
      },
      {
        title: "屏蔽和举报",
        blocks: [
          "你可以随时在对方资料页屏蔽其他用户。屏蔽后，你们双方都不会在浏览、喜欢或配对中看到对方，也无法再互发消息。你也可以举报行为不当的资料；举报会被审核，并可能导致被举报的账户被删除。",
          "如需告诉我们其他问题——安全隐患、诈骗或程序错误——请使用应用设置中的“反馈问题”，或访问 {reportPage}，无需离开 Blossom。",
          "当聊天中的消息提到钱或转到其他应用时，会显示一条安全提示。这项检查只在你的设备上进行：我们的服务器不会因此扫描你的消息。",
        ],
      },
      {
        title: "儿童安全",
        blocks: [
          "Blossom 仅限 18 岁及以上的成年人使用。我们不会故意允许未成年人创建账户，并在注册时通过出生日期核实年龄。",
          "Blossom 对儿童性虐待材料（CSAM）及任何形式的儿童性剥削采取**零容忍**。任何涉及此类活动的账户都会被立即封禁，并报告给美国国家失踪与受剥削儿童中心（NCMEC）和/或相关执法机构。",
          "你可以因任何原因举报某个资料，包括涉嫌违反儿童安全的行为，只需在该资料页使用**举报**按钮，或通过“反馈问题”→“儿童安全问题”。你也可以直接联系我们指定的联系人：{safety}（或 {contact}）。我们会审核并处理所有举报，包括删除违规的账户和内容。我们完整的儿童安全标准：{childSafety}。",
        ],
      },
      {
        title: "数据保留与删除",
        blocks: [
          "你可以随时永久删除你的账户：在应用中，前往 设置 →“删除账户”（页面底部）；在网站上，前往 设置 → 删除账户。你也可以不登录，在 {deletePage} 申请删除。删除账户会移除你的资料、照片、简介、配对、喜欢以及你发送的所有消息。此操作无法撤销。你发送给我们的举报可能会被保留，以保障 Blossom 的安全。",
          "部分数据会被自动删除：创建资料一小时后仍没有照片的账户，以及从未完成资料的账户；位于 Blossom 尚未开放国家的账户；审核完成的认证自拍；每周删除的访问记录；已使用或已过期的邮箱验证码。",
          "只是想暂停一下？应用设置中的“暂停一下”会在浏览中隐藏你的资料，而不会删除任何内容。",
        ],
      },
      {
        title: "安全",
        blocks: [
          "密码在保存前会经过哈希处理，绝不以明文存储或传输。访问应用需要使用会自动过期的签名令牌进行验证。",
        ],
      },
      {
        title: "政策变更",
        blocks: [
          "我们可能会不时更新本政策。变更后继续使用 Blossom 即表示你接受更新后的政策。",
        ],
      },
      {
        title: "联系我们",
        blocks: [
          "对本政策或你的数据有疑问？请发邮件给我们的客服：{support}。你也可以通过 {contact} 联系我们。",
        ],
      },
    ],
  },

  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 5 نوفمبر 2026",
    sections: [
      {
        blocks: [
          "تُشغّل Blossom (\"نحن\") تطبيق المواعدة Blossom (\"الخدمة\")، المتاح على الويب وكتطبيق Android. توضّح سياسة الخصوصية هذه المعلومات التي نجمعها وكيف نستخدمها والخيارات المتاحة لك.",
        ],
      },
      {
        title: "المعلومات التي نجمعها",
        blocks: [
          "**معلومات الحساب:** اسم المستخدم وعنوان البريد الإلكتروني ورقم الهاتف وكلمة المرور (تُحفظ كتجزئة أحادية الاتجاه ولا تُخزَّن أبدًا كنص واضح) وتاريخ الميلاد (يُستخدم فقط للتأكد من أن عمرك 18 عامًا أو أكثر).",
          "**معلومات الملف الشخصي:** النبذة والعمر والجنس والتوجه الجنسي والطول والمهنة والتعليم ونمط الحياة وأهداف العلاقة واللغات والمدينة/الدولة وأي صور تقوم برفعها.",
          "**معلومات الاستخدام:** الإعجابات والتطابقات والرسائل التي ترسلها إلى المستخدمين الآخرين، والفعاليات التي تنشئها أو تنضم إليها وتعليقاتها، والأماكن التي تحفظها أو تقترحها، وأي حظر أو بلاغ تقدّمه.",
          "**صورة التحقق (اختياري):** إذا طلبت شارة التوثيق ✓، تلتقط صورة سيلفي وأنت تقلّد وضعية. لا يراها إلا فريق Blossom لمقارنتها بصورك، وتُحذف فور التحقق منها؛ ولا يُحتفظ إلا بالنتيجة (موثّق أم لا).",
          "**الموقع التقريبي (اختياري):** إذا سمحت بذلك، يقرأ تطبيق Blossom أو موقعه الإلكتروني موقعك التقريبي (وليس موقعك الدقيق أبدًا) لإبقاء المدينة والدولة في ملفك الشخصي محدّثتين، وللتأكد من توفر Blossom في مكانك؛ وفي البلد غير المتاح فيه يُحذف الحساب. لا نحفظ إلا المدينة والدولة الناتجتين، ولا نحتفظ بالموقع نفسه. يمكنك الرفض في نافذة الإذن، أو إيقاف ذلك في أي وقت من إعدادات التطبيق أو إعدادات هاتفك.",
          "**المنطقة الزمنية للجهاز:** عند إنشاء ملفك الشخصي، يرسل التطبيق أو الموقع المنطقة الزمنية لجهازك (مثل Europe/Paris) للتأكد من توفر Blossom في بلدك. ولا يتم حفظها.",
          "**الإشعارات (التطبيق، اختياري):** إذا سمحت بالإشعارات، نحفظ رمز إشعارات لهاتفك ولغة التطبيق، حتى نخبرك بالإعجابات والتطابقات والرسائل الجديدة.",
          "**الزيارات:** عندما تفتح التطبيق أو الموقع، نسجّل الزيارة - معرّفًا عشوائيًا لجهازك أو متصفحك، والمنصة (تطبيق أو ويب)، واللغة، والمنطقة الزمنية، والصفحات أو الشاشات التي شاهدتها - لإحصاء عدد الزوار. لا نحفظ أي عنوان IP، ولا تغطي هذه السجلات إلا الأسبوع الحالي: إذ تُحذف كل يوم اثنين.",
          "**البلاغات والملاحظات:** ما ترسله إلينا عبر «الإبلاغ عن مشكلة»، وإذا لم تكن مسجّلًا للدخول، عنوان البريد الإلكتروني الذي تختار تقديمه لنتمكن من الرد عليك.",
          "**المنشآت:** إذا أرسلت طلب شراكة أو رسالة بخصوص مقهى أو مطعم أو مكان آخر، نحتفظ ببيانات المكان واسمك وبريدك الإلكتروني ورقم هاتفك للرد عليك وإدارة عروضك.",
          "لا نجمع عن علم أي معلومات من أي شخص دون 18 عامًا. يُمنع التسجيل لكل من لا يؤكد تاريخ ميلاد يدل على أن عمره 18 عامًا أو أكثر.",
        ],
      },
      {
        title: "كيف نستخدم معلوماتك",
        blocks: [
          [
            "لإنشاء حسابك وتشغيله",
            "لعرض ملفك الشخصي على المستخدمين الآخرين واقتراح التطابقات",
            "لإيصال الرسائل بين المستخدمين المتطابقين",
            "لإرسال رموز التحقق (التسجيل وإعادة تعيين كلمة المرور) عبر البريد الإلكتروني",
            "لإرسال الإشعارات التي سمحت بها (الإعجابات والتطابقات والرسائل الجديدة)",
            "للتأكد من توفر Blossom في بلدك",
            "لإحصاء زوارنا وتحسين Blossom (سجلات الزيارات تُحذف كل أسبوع)",
            "للحفاظ على أمان Blossom: مراجعة صور التحقق، ومعالجة البلاغات والحظر، وحذف الحسابات المزيفة أو الاحتيالية أو المخالفة للقواعد",
          ],
        ],
      },
      {
        title: "المشاركة مع أطراف ثالثة",
        blocks: [
          "نستعين بمزوّدي الخدمات التاليين لتشغيل Blossom، ولا يعالجون البيانات إلا بالقدر اللازم لتقديم خدمتهم لنا:",
          [
            "**Cloudinary**: تخزين الصور التي ترفعها وعرضها (وصور التحقق حتى يتم التحقق منها)",
            "**Brevo**: إرسال رسائل التحقق وإعادة تعيين كلمة المرور ورسائل الخدمة الأخرى",
            "**Expo وGoogle Firebase Cloud Messaging**: إيصال إشعارات التطبيق",
            "**OpenStreetMap (Nominatim)**: على الموقع الإلكتروني، تحديد المدينة من موقع مقرّب إلى نحو كيلومتر",
            "**Render**: استضافة الخادم وقاعدة البيانات",
          ],
          "لا نبيع معلوماتك الشخصية لأي أحد.",
        ],
      },
      {
        title: "ما يمكن للمستخدمين الآخرين رؤيته",
        blocks: [
          "ملفك الشخصي (الصور والنبذة والتفاصيل التي تملؤها ومدينتك وبلدك)، وشارة ✓ إذا كنت موثّقًا، وأي رسائل ترسلها إلى من تطابقت معه. لا يُعرض بريدك الإلكتروني ورقم هاتفك وكلمة مرورك وموقعك وصورة التحقق على المستخدمين الآخرين أبدًا.",
        ],
      },
      {
        title: "الحظر والإبلاغ",
        blocks: [
          "يمكنك حظر أي مستخدم في أي وقت من ملفه الشخصي؛ وبعد الحظر لن يرى أيٌّ منكما الآخر في التصفح أو الإعجابات أو التطابقات، ولن تتمكنا من مراسلة بعضكما. يمكنك أيضًا الإبلاغ عن ملف شخصي بسبب سلوك غير لائق؛ تتم مراجعة البلاغات وقد تؤدي إلى حذف الحساب المُبلَّغ عنه.",
          "لإخبارنا بأي مشكلة أخرى - مخاوف تتعلق بالأمان أو احتيال أو خلل - استخدم «الإبلاغ عن مشكلة» في إعدادات التطبيق، أو {reportPage}، دون مغادرة Blossom.",
          "عندما تذكر رسالة في المحادثة المال أو الانتقال إلى تطبيق آخر، تظهر نصيحة أمان. يتم هذا التحقق على جهازك فقط: لا يتم فحص رسائلك على خوادمنا لهذا الغرض.",
        ],
      },
      {
        title: "سلامة الأطفال",
        blocks: [
          "Blossom مخصّص حصريًا للبالغين بعمر 18 عامًا فأكثر. لا نسمح عن علم للقاصرين بإنشاء حسابات، ويتم التحقق من العمر عند التسجيل عبر تاريخ الميلاد.",
          "تعتمد Blossom سياسة **عدم التسامح مطلقًا** مع مواد الاعتداء الجنسي على الأطفال (CSAM) أو أي شكل من أشكال الاستغلال الجنسي للأطفال. يُحظر فورًا أي حساب يثبت تورطه في ذلك، ويُبلَّغ عنه إلى المركز الوطني للأطفال المفقودين والمستغَلين (NCMEC) و/أو السلطات المختصة.",
          "يمكنك الإبلاغ عن أي ملف شخصي لأي سبب، بما في ذلك الاشتباه في انتهاكات تتعلق بسلامة الأطفال، مباشرةً من ذلك الملف باستخدام زر **إبلاغ**، أو عبر «الإبلاغ عن مشكلة» ← «مخاوف تتعلق بسلامة طفل». يمكنك أيضًا إرسال مخاوفك مباشرةً إلى جهة الاتصال المخصّصة لدينا: {safety} (أو {contact}). نراجع جميع البلاغات ونتخذ الإجراءات اللازمة، بما في ذلك حذف الحسابات والمحتوى المخالف. معاييرنا الكاملة لسلامة الأطفال: {childSafety}.",
        ],
      },
      {
        title: "الاحتفاظ بالبيانات وحذفها",
        blocks: [
          "يمكنك حذف حسابك نهائيًا في أي وقت: في التطبيق من الإعدادات ← \"حذف الحساب\" (أسفل الصفحة)، وعلى الموقع من الإعدادات ← حذف الحساب. يمكنك أيضًا طلب الحذف دون تسجيل الدخول عبر {deletePage}. يؤدي حذف الحساب إلى إزالة ملفك الشخصي وصورك ونبذتك وتطابقاتك وإعجاباتك وجميع الرسائل التي أرسلتها. لا يمكن التراجع عن هذا الإجراء. قد نحتفظ بالبلاغات التي أرسلتها إلينا للحفاظ على أمان Blossom.",
          "تُحذف بعض البيانات تلقائيًا: الحسابات التي لا تزال بلا صور بعد ساعة من إنشاء الملف الشخصي، والحسابات التي لا تُكمل ملفها أبدًا؛ والحسابات الموجودة في بلد لا يتوفر فيه Blossom؛ وصور التحقق بعد مراجعتها؛ وسجلات الزيارات كل أسبوع؛ ورموز التحقق عبر البريد بعد استخدامها أو انتهاء صلاحيتها.",
          "تريد استراحة فقط؟ خيار \"خذ استراحة\" في إعدادات التطبيق يُخفي ملفك الشخصي من التصفح دون حذف أي شيء.",
        ],
      },
      {
        title: "الأمان",
        blocks: [
          "تُجزَّأ كلمات المرور قبل حفظها ولا تُخزَّن أو تُرسَل أبدًا كنص واضح. يتم التحقق من الوصول إلى التطبيق باستخدام رموز موقّعة تنتهي صلاحيتها تلقائيًا.",
        ],
      },
      {
        title: "التغييرات على هذه السياسة",
        blocks: [
          "قد نحدّث هذه السياسة من وقت لآخر. استمرارك في استخدام Blossom بعد أي تغيير يعني موافقتك على السياسة المحدّثة.",
        ],
      },
      {
        title: "اتصل بنا",
        blocks: [
          "لديك أسئلة حول هذه السياسة أو بياناتك؟ راسل فريق الدعم على {support}. يمكنك أيضًا التواصل معنا على {contact}.",
        ],
      },
    ],
  },
};
