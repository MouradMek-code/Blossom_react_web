// The privacy policy in the four site languages (pages/PrivacyPolicy.jsx).
// Each section is a title and blocks: a string is a paragraph, an array a
// bulleted list. In the text, **...** is bold, {support} / {contact} are the
// emails, {safety} the support email with a "Child Safety Report" subject and
// {deletePage} the link to /delete-account.
// Keep the four versions saying the same thing.

export const PRIVACY_POLICY = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 27, 2026",
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
          "**Usage information:** likes, matches, messages you send to other users, and any blocks or reports you submit.",
          "**Approximate location (app, optional):** if you allow it, the Blossom app reads your phone's approximate location (never your precise position) to keep the city and country on your profile up to date. Only the resulting city and country are stored; the position itself is not kept. You can turn this off at any time in Settings or in your phone's settings.",
          "**Notifications (app, optional):** if you allow notifications, we store a notification token for your phone and your app language, so we can tell you about new likes, matches and messages.",
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
            "To enforce our safety rules - acting on blocks and reports, and removing accounts that violate our terms",
          ],
        ],
      },
      {
        title: "Sharing With Third Parties",
        blocks: [
          "We use the following service providers to operate Blossom. They process data only as needed to provide their service to us:",
          [
            "**Cloudinary** - stores and serves the photos you upload",
            "**Brevo** - sends verification and password-reset emails",
            "**Expo and Google Firebase Cloud Messaging** - deliver the app's notifications",
            "**Render** - hosts our backend server and database",
          ],
          "We do not sell your personal information to anyone.",
        ],
      },
      {
        title: "Other Users Can See",
        blocks: [
          "Your profile (photos, bio, and the details you fill in), and any messages you send to a match. Your email, phone number, and password are never shown to other users.",
        ],
      },
      {
        title: "Blocking and Reporting",
        blocks: [
          "You can block another user at any time from their profile - once blocked, neither of you will see the other in Browse, Likes, or Matches, and you can no longer message each other. You can also report a profile for inappropriate behavior; reports are reviewed and may result in the reported account being removed.",
        ],
      },
      {
        title: "Child Safety",
        blocks: [
          "Blossom is strictly for adults aged 18 and older. We do not knowingly allow minors to create accounts, and age is verified at signup via date of birth.",
          "Blossom has **zero tolerance** for child sexual abuse material (CSAM) or any form of child sexual exploitation. Any account found to be involved in such activity is immediately banned and reported to the National Center for Missing & Exploited Children (NCMEC) and/or relevant law enforcement authorities.",
          "You can report a profile for any reason, including suspected child safety violations, directly from that profile using the **Report** button. You can also report concerns directly to our designated point of contact at {safety} (or {contact}). We review and act on all reports, including removing violating accounts and content.",
        ],
      },
      {
        title: "Data Retention & Deletion",
        blocks: [
          'You can permanently delete your account at any time: in the app, Settings → "Delete account" (at the bottom of the page); on the website, Settings → Delete account. You can also request deletion without logging in at {deletePage}. Deleting your account removes your profile, photos, bio, matches, likes, and all messages you\'ve sent. This action cannot be undone.',
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
    updated: "Dernière mise à jour : 27 octobre 2026",
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
          "**Informations d'utilisation :** likes, matchs, messages envoyés aux autres membres, ainsi que les blocages et signalements que vous effectuez.",
          "**Position approximative (application, facultatif) :** si vous l'autorisez, l'application Blossom lit la position approximative de votre téléphone (jamais votre position précise) pour garder à jour la ville et le pays de votre profil. Seuls la ville et le pays obtenus sont enregistrés ; la position elle-même n'est pas conservée. Vous pouvez désactiver cette option à tout moment dans les Réglages ou dans les réglages de votre téléphone.",
          "**Notifications (application, facultatif) :** si vous autorisez les notifications, nous enregistrons un identifiant de notification pour votre téléphone ainsi que la langue de l'application, afin de vous prévenir des nouveaux likes, matchs et messages.",
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
            "Pour appliquer nos règles de sécurité : traiter les blocages et les signalements, et supprimer les comptes qui enfreignent nos conditions",
          ],
        ],
      },
      {
        title: "Partage avec des tiers",
        blocks: [
          "Nous faisons appel aux prestataires suivants pour faire fonctionner Blossom. Ils ne traitent les données que dans la mesure nécessaire pour nous fournir leur service :",
          [
            "**Cloudinary** : stocke et affiche les photos que vous ajoutez",
            "**Brevo** : envoie les e-mails de vérification et de réinitialisation du mot de passe",
            "**Expo et Google Firebase Cloud Messaging** : envoient les notifications de l'application",
            "**Render** : héberge notre serveur et notre base de données",
          ],
          "Nous ne vendons vos informations personnelles à personne.",
        ],
      },
      {
        title: "Ce que les autres membres peuvent voir",
        blocks: [
          "Votre profil (photos, bio et les informations que vous renseignez) et les messages que vous envoyez à un match. Votre e-mail, votre numéro de téléphone et votre mot de passe ne sont jamais montrés aux autres membres.",
        ],
      },
      {
        title: "Blocage et signalement",
        blocks: [
          "Vous pouvez bloquer un autre membre à tout moment depuis son profil : une fois bloqué, aucun de vous deux ne verra l'autre dans Explorer, les Likes ou les Matchs, et vous ne pourrez plus vous écrire. Vous pouvez aussi signaler un profil pour comportement inapproprié ; les signalements sont examinés et peuvent entraîner la suppression du compte signalé.",
        ],
      },
      {
        title: "Protection des enfants",
        blocks: [
          "Blossom est strictement réservé aux adultes de 18 ans et plus. Nous n'autorisons pas sciemment les mineurs à créer un compte, et l'âge est vérifié à l'inscription grâce à la date de naissance.",
          "Blossom applique une **tolérance zéro** envers les contenus d'abus sexuels sur mineurs (CSAM) et toute forme d'exploitation sexuelle d'enfants. Tout compte impliqué dans une telle activité est immédiatement banni et signalé au National Center for Missing & Exploited Children (NCMEC) et/ou aux autorités compétentes.",
          "Vous pouvez signaler un profil pour n'importe quelle raison, y compris une suspicion d'atteinte à la sécurité des enfants, directement depuis ce profil avec le bouton **Signaler**. Vous pouvez aussi signaler vos inquiétudes à notre point de contact désigné : {safety} (ou {contact}). Nous examinons tous les signalements et agissons en conséquence, notamment en supprimant les comptes et contenus en infraction.",
        ],
      },
      {
        title: "Conservation et suppression des données",
        blocks: [
          "Vous pouvez supprimer définitivement votre compte à tout moment : dans l'application, Réglages → « Supprimer le compte » (en bas de la page) ; sur le site, Réglages → Supprimer le compte. Vous pouvez aussi demander la suppression sans vous connecter sur {deletePage}. La suppression retire votre profil, vos photos, votre bio, vos matchs, vos likes et tous les messages que vous avez envoyés. Cette action est irréversible.",
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
    updated: "最后更新：2026年10月27日",
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
          "**使用信息：**喜欢、配对、你发送给其他用户的消息，以及你提交的屏蔽和举报。",
          "**大致位置（应用，可选）：**如果你允许，Blossom 应用会读取手机的大致位置（绝不读取精确位置），以保持你资料中的城市和国家为最新。我们只保存得出的城市和国家，不保存位置本身。你可以随时在设置或手机设置中关闭此功能。",
          "**通知（应用，可选）：**如果你允许通知，我们会保存你手机的通知令牌和应用语言，以便告诉你新的喜欢、配对和消息。",
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
            "执行我们的安全规则：处理屏蔽和举报，并删除违反条款的账户",
          ],
        ],
      },
      {
        title: "与第三方共享",
        blocks: [
          "我们使用以下服务商来运营 Blossom。他们仅在为我们提供服务所需的范围内处理数据：",
          [
            "**Cloudinary**：存储并展示你上传的照片",
            "**Brevo**：发送验证和重置密码邮件",
            "**Expo 和 Google Firebase Cloud Messaging**：发送应用通知",
            "**Render**：托管我们的后端服务器和数据库",
          ],
          "我们绝不出售你的个人信息。",
        ],
      },
      {
        title: "其他用户可以看到的内容",
        blocks: [
          "你的资料（照片、简介和你填写的信息），以及你发给配对对象的消息。你的电子邮箱、电话号码和密码绝不会展示给其他用户。",
        ],
      },
      {
        title: "屏蔽和举报",
        blocks: [
          "你可以随时在对方资料页屏蔽其他用户。屏蔽后，你们双方都不会在浏览、喜欢或配对中看到对方，也无法再互发消息。你也可以举报行为不当的资料；举报会被审核，并可能导致被举报的账户被删除。",
        ],
      },
      {
        title: "儿童安全",
        blocks: [
          "Blossom 仅限 18 岁及以上的成年人使用。我们不会故意允许未成年人创建账户，并在注册时通过出生日期核实年龄。",
          "Blossom 对儿童性虐待材料（CSAM）及任何形式的儿童性剥削采取**零容忍**。任何涉及此类活动的账户都会被立即封禁，并报告给美国国家失踪与受剥削儿童中心（NCMEC）和/或相关执法机构。",
          "你可以因任何原因举报某个资料，包括涉嫌违反儿童安全的行为，只需在该资料页使用**举报**按钮。你也可以直接联系我们指定的联系人：{safety}（或 {contact}）。我们会审核并处理所有举报，包括删除违规的账户和内容。",
        ],
      },
      {
        title: "数据保留与删除",
        blocks: [
          "你可以随时永久删除你的账户：在应用中，前往 设置 →“删除账户”（页面底部）；在网站上，前往 设置 → 删除账户。你也可以不登录，在 {deletePage} 申请删除。删除账户会移除你的资料、照片、简介、配对、喜欢以及你发送的所有消息。此操作无法撤销。",
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
    updated: "آخر تحديث: 27 أكتوبر 2026",
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
          "**معلومات الاستخدام:** الإعجابات والتطابقات والرسائل التي ترسلها إلى المستخدمين الآخرين وأي حظر أو بلاغ تقدّمه.",
          "**الموقع التقريبي (التطبيق، اختياري):** إذا سمحت بذلك، يقرأ تطبيق Blossom الموقع التقريبي لهاتفك (وليس موقعك الدقيق أبدًا) لإبقاء المدينة والدولة في ملفك الشخصي محدّثتين. لا نحفظ إلا المدينة والدولة الناتجتين، ولا نحتفظ بالموقع نفسه. يمكنك إيقاف ذلك في أي وقت من الإعدادات أو من إعدادات هاتفك.",
          "**الإشعارات (التطبيق، اختياري):** إذا سمحت بالإشعارات، نحفظ رمز إشعارات لهاتفك ولغة التطبيق، حتى نخبرك بالإعجابات والتطابقات والرسائل الجديدة.",
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
            "لتطبيق قواعد الأمان لدينا: التعامل مع الحظر والبلاغات وحذف الحسابات التي تخالف شروطنا",
          ],
        ],
      },
      {
        title: "المشاركة مع أطراف ثالثة",
        blocks: [
          "نستعين بمزوّدي الخدمات التاليين لتشغيل Blossom، ولا يعالجون البيانات إلا بالقدر اللازم لتقديم خدمتهم لنا:",
          [
            "**Cloudinary**: تخزين الصور التي ترفعها وعرضها",
            "**Brevo**: إرسال رسائل التحقق وإعادة تعيين كلمة المرور",
            "**Expo وGoogle Firebase Cloud Messaging**: إيصال إشعارات التطبيق",
            "**Render**: استضافة الخادم وقاعدة البيانات",
          ],
          "لا نبيع معلوماتك الشخصية لأي أحد.",
        ],
      },
      {
        title: "ما يمكن للمستخدمين الآخرين رؤيته",
        blocks: [
          "ملفك الشخصي (الصور والنبذة والتفاصيل التي تملؤها) وأي رسائل ترسلها إلى من تطابقت معه. لا يُعرض بريدك الإلكتروني ورقم هاتفك وكلمة مرورك على المستخدمين الآخرين أبدًا.",
        ],
      },
      {
        title: "الحظر والإبلاغ",
        blocks: [
          "يمكنك حظر أي مستخدم في أي وقت من ملفه الشخصي؛ وبعد الحظر لن يرى أيٌّ منكما الآخر في التصفح أو الإعجابات أو التطابقات، ولن تتمكنا من مراسلة بعضكما. يمكنك أيضًا الإبلاغ عن ملف شخصي بسبب سلوك غير لائق؛ تتم مراجعة البلاغات وقد تؤدي إلى حذف الحساب المُبلَّغ عنه.",
        ],
      },
      {
        title: "سلامة الأطفال",
        blocks: [
          "Blossom مخصّص حصريًا للبالغين بعمر 18 عامًا فأكثر. لا نسمح عن علم للقاصرين بإنشاء حسابات، ويتم التحقق من العمر عند التسجيل عبر تاريخ الميلاد.",
          "تعتمد Blossom سياسة **عدم التسامح مطلقًا** مع مواد الاعتداء الجنسي على الأطفال (CSAM) أو أي شكل من أشكال الاستغلال الجنسي للأطفال. يُحظر فورًا أي حساب يثبت تورطه في ذلك، ويُبلَّغ عنه إلى المركز الوطني للأطفال المفقودين والمستغَلين (NCMEC) و/أو السلطات المختصة.",
          "يمكنك الإبلاغ عن أي ملف شخصي لأي سبب، بما في ذلك الاشتباه في انتهاكات تتعلق بسلامة الأطفال، مباشرةً من ذلك الملف باستخدام زر **إبلاغ**. يمكنك أيضًا إرسال مخاوفك مباشرةً إلى جهة الاتصال المخصّصة لدينا: {safety} (أو {contact}). نراجع جميع البلاغات ونتخذ الإجراءات اللازمة، بما في ذلك حذف الحسابات والمحتوى المخالف.",
        ],
      },
      {
        title: "الاحتفاظ بالبيانات وحذفها",
        blocks: [
          "يمكنك حذف حسابك نهائيًا في أي وقت: في التطبيق من الإعدادات ← \"حذف الحساب\" (أسفل الصفحة)، وعلى الموقع من الإعدادات ← حذف الحساب. يمكنك أيضًا طلب الحذف دون تسجيل الدخول عبر {deletePage}. يؤدي حذف الحساب إلى إزالة ملفك الشخصي وصورك ونبذتك وتطابقاتك وإعجاباتك وجميع الرسائل التي أرسلتها. لا يمكن التراجع عن هذا الإجراء.",
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
