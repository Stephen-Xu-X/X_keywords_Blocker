# X / Twitter 多语言屏蔽词库调研稿

> 调研日期：2026-08-10  
> 用途：为项目后续 `keywords.md` 分类和远程 Raw 加载提供候选数据。本文是研究稿，不应整份直接导入。  
> 隐私原则：不收录普通人的姓名、账号、电话、钱包地址、群号或精确住址；公开人物姓名也不作为默认词，以免误伤正常新闻和讨论。

## 1. 使用前必须知道的 X 匹配行为

X 官方说明：屏蔽词不区分大小写；屏蔽一个词也会屏蔽同词 hashtag；支持短语、用户名、emoji 和所有 X 支持的语言；生效范围是 Home timeline、Notifications 和回复，不影响搜索结果。短词和常用词因此非常容易误杀。

本稿采用三个风险层级：

- **A / 建议默认**：较长、意图明确的引流或诈骗短语，单独命中也有较高置信度。
- **B / 建议用户自选**：垃圾内容中常见，但也可能出现在正常讨论；默认不勾选。
- **C / 仅作组合信号**：过短、歧义大或属于平台/资产通用名；不能作为默认 muted keyword，适合未来做多词规则或正则检测。

## 2. 来源类型

- **[X-OFFICIAL]** X Help：高级屏蔽词行为与范围。
- **[X-OBS]** 公开 X 帖子、公开搜索结果或新闻报道中可观察到的重复话术。
- **[GOV]** 政府、警方、金融监管或国家网络安全机构披露的诈骗诱导话术。
- **[RESEARCH]** 公开论文中总结的 Twitter/X、Telegram 加密诈骗、拉盘和恢复骗局模式。
- **[COMMUNITY]** 公开社区、博客、社媒管理资料总结的机器人评论话术。
- **[USER-SEED]** 项目用户提供并已在中文 X 评论区观察到的词。
- **[TRANSLATION]** 基于已验证诈骗意图做的语义翻译扩展；发布前应由对应母语使用者复核。

## 3. A 级：建议默认候选

### 3.1 广告、引流、涨粉和互动诱饵

#### 简体中文 `zh-Hans`

`蓝V互粉`、`互关互赞`、`互粉互赞`、`有赞必回`、`关注必回`、`涨粉秘籍`、`快速涨粉`、`免费涨粉`、`付费推广`、`商务合作私信`、`详情私信我`、`私信领取资料`、`评论区扣1`、`主页有惊喜`、`点我主页`、`看我主页`、`主页置顶`、`主页链接领取`、`进群免费领`、`加我免费领`、`免费领取教程`、`限时免费领取`、`招代理私聊`、`日结兼职私聊`、`无需经验日结`、`在家就能赚钱`、`零基础轻松赚钱`、`每天稳定收益`、`毫无疑问普通人也可以`、`这仅仅是开始`。 `[USER-SEED][TRANSLATION]`

#### 繁体中文 `zh-Hant`

`互追互讚`、`追蹤必回`、`免費漲粉`、`詳情私訊我`、`私訊領取資料`、`點我主頁`、`主頁連結領取`、`加入群組免費領`、`在家也能賺錢`、`每日穩定收益`、`限時免費領取`、`招代理私訊`。 `[TRANSLATION]`

#### English `en`

`promote it on`、`send pic to`、`send this pic to`、`paid promo available`、`DM for paid promotion`、`DM for promotion`、`feature you on our page`、`get featured on our page`、`buy followers now`、`gain followers fast`、`follow for follow back`、`instant followers`、`check the link in my bio`、`click the link in my bio`、`details in my bio`、`message me for details`、`DM me for details`、`work from home and earn`、`earn money from home`、`make money every day`、`no experience required`、`limited spots available`、`comment YES below`。 `[COMMUNITY][TRANSLATION]`

#### 日本語 `ja`

`相互フォローお願いします`、`フォロバ100`、`フォロー必ず返します`、`無料でフォロワー増加`、`詳しくはDM`、`詳細はプロフィール`、`プロフのリンクから`、`プロフィール見て`、`プロフ見て`、`固定ポストを見て`、`無料で受け取る`、`副業で毎日稼ぐ`、`スマホだけで稼げる`、`初心者でも稼げる`、`在宅で高収入`、`LINE追加で無料`、`今すぐLINE追加`。 `[X-OBS][TRANSLATION]`

#### 한국어 `ko`

`맞팔 100%`、`팔로우하면 맞팔`、`무료 팔로워 늘리기`、`자세한 내용은 DM`、`프로필 링크 확인`、`링크는 프로필에`、`무료 자료 받기`、`재택으로 돈 벌기`、`초보도 쉽게 수익`、`매일 안정적인 수익`、`카톡으로 문의`、`오픈채팅으로 문의`。 `[TRANSLATION]`

#### Español `es`

`sígueme y te sigo`、`seguimiento por seguimiento`、`compra seguidores`、`consigue seguidores rápido`、`promoción pagada`、`envíame DM para promoción`、`mándame un mensaje para más información`、`enlace en mi biografía`、`mira el enlace de mi perfil`、`gana dinero desde casa`、`gana dinero todos los días`、`sin experiencia necesaria`、`cupos limitados`、`comenta SÍ`。 `[X-OBS][TRANSLATION]`

#### Português `pt`

`sigo de volta`、`compre seguidores`、`ganhe seguidores rápido`、`divulgação paga`、`chama no direct`、`link na minha bio`、`confira meu perfil`、`ganhe dinheiro em casa`、`renda extra diária`、`sem experiência necessária`。 `[TRANSLATION]`

### 3.2 加密、投资、赌博和快速赚钱诈骗

#### 简体中文 `zh-Hans`

`保证高收益`、`稳赚不赔`、`保本高收益`、`零风险投资`、`内部消息稳赚`、`内幕消息免费分享`、`免费荐股`、`免费推荐股票`、`免费领取牛股`、`每日推荐牛股`、`明日必涨`、`涨停股提前布局`、`翻倍牛股`、`股票交流群免费`、`免费投资交流群`、`老师带单`、`跟单稳赚`、`量化套利稳赚`、`搬砖套利`、`每天稳定盈利`、`快速获利`、`被动收入每天到账`、`注册送币`、`免费空投领取`、`空投马上结束`、`连接钱包领取空投`、`验证钱包领取`、`私钥验证`、`提交助记词`、`客服帮你追回`、`被骗资金可追回`、`加密货币追回`、`解冻账户需缴费`、`提现需缴税`、`充值解锁提现`、`双倍返还比特币`、`充值多少返多少`、`带你上岸`、`彩票内部号码`、`稳赚七码`。 `[USER-SEED][GOV][RESEARCH][TRANSLATION]`

#### 繁体中文 `zh-Hant`

`保證高收益`、`穩賺不賠`、`零風險投資`、`內幕消息免費分享`、`免費薦股`、`明日必漲`、`老師帶單`、`跟單穩賺`、`免費空投領取`、`連接錢包領取`、`提交助記詞`、`被騙資金可追回`、`提現需繳稅`、`充值解鎖提現`。 `[TRANSLATION]`

#### English `en`

`guaranteed high returns`、`guaranteed profits`、`risk-free investment`、`zero risk investment`、`double your money fast`、`turn $100 into`、`earn daily profits`、`passive income guaranteed`、`limited investment slots`、`VIP trading signals`、`free crypto signals`、`join our signal group`、`pump signal group`、`next 100x gem`、`next 1000x coin`、`presale ends soon`、`claim your free airdrop`、`airdrop claim is live`、`connect wallet to claim`、`validate your wallet`、`synchronize your wallet`、`rectify your wallet`、`wallet verification required`、`submit your seed phrase`、`send your recovery phrase`、`DM for wallet recovery`、`recover your stolen crypto`、`recover your lost funds`、`kindly send a direct message`、`get your money back today`、`pay tax to withdraw`、`pay fee to unlock withdrawal`、`send bitcoin and get double`、`I am giving back to my community`。 `[GOV][X-OBS][RESEARCH][COMMUNITY]`

#### 日本語 `ja`

`必ず儲かる`、`絶対に儲かる`、`元本保証で高収益`、`損失は全額補償`、`優良株を無料でシェア`、`優良株を無料で紹介`、`毎日良い銘柄を紹介`、`毎日急騰している銘柄`、`急騰銘柄を無料公開`、`明日上がる銘柄`、`無料の投資セミナー`、`無料投資グループ`、`LINEで銘柄情報`、`LINE追加で銘柄公開`、`株で資産を倍増`、`先生のおかげで儲けた`、`彼の勧める銘柄を買って`、`数ヶ月彼を観察した後`、`偶然見つけた投資家`、`が紹介したブロガー`、`が言及したブロガー`、`暗号資産で確実に利益`、`エアドロップを受け取る`、`ウォレットを接続して受取`、`ウォレットを同期`、`資金を取り戻せます`、`被害金を回収します`、`出金には税金が必要`。 `[X-OBS][GOV][RESEARCH][TRANSLATION]`

#### 한국어 `ko`

`원금 보장 고수익`、`고수익 보장`、`수익률 800% 달성`、`손해는 전액 배상`、`무료 투자 정보 제공`、`무료 종목 추천`、`급등주 무료 추천`、`상장 예정 주식 추천`、`무료 리딩방`、`투자 리딩방 초대`、`텔레그램 리딩방`、`카톡 투자방 초대`、`앱만 깔면 고수익`、`무조건 급등하는 종목`、`매일 안정적인 수익`、`코인 수익 보장`、`무료 에어드롭 받기`、`지갑 연결하고 받기`、`지갑 인증 필요`、`시드 문구를 보내주세요`、`피해 금액 복구`、`출금하려면 세금 납부`。 `[GOV][COMMUNITY][TRANSLATION]`

#### Español `es`

`ganancias garantizadas`、`rentabilidad garantizada`、`inversión sin riesgo`、`multiplica tu dinero rápidamente`、`gana dinero rápido`、`beneficios diarios garantizados`、`señales de trading VIP`、`grupo de señales gratis`、`próxima cripto 100x`、`airdrops gratis`、`reclama tu airdrop`、`conecta tu billetera`、`verifica tu billetera`、`envía tu frase semilla`、`recuperamos tus criptomonedas`、`recupera tus fondos perdidos`、`paga el impuesto para retirar`、`paga una comisión para desbloquear`、`envía bitcoin y recibe el doble`、`oferta válida por tiempo limitado`。 `[X-OBS][GOV][RESEARCH][TRANSLATION]`

#### Français `fr`

`rendements garantis`、`investissement sans risque`、`doublez votre argent rapidement`、`profits quotidiens garantis`、`signaux crypto gratuits`、`réclamez votre airdrop`、`connectez votre portefeuille`、`validez votre portefeuille`、`envoyez votre phrase de récupération`、`récupérez vos fonds volés`、`payez les frais pour retirer`。 `[TRANSLATION]`

#### Deutsch `de`

`garantierte Rendite`、`risikofreie Investition`、`Geld schnell verdoppeln`、`garantierte tägliche Gewinne`、`kostenlose Krypto Signale`、`Airdrop jetzt beanspruchen`、`Wallet verbinden`、`Wallet verifizieren`、`Seed Phrase senden`、`gestohlene Kryptowährung zurückholen`、`Gebühr zahlen um abzuheben`。 `[TRANSLATION]`

#### Bahasa Indonesia `id`

`keuntungan dijamin`、`investasi tanpa risiko`、`cuan setiap hari`、`profit harian dijamin`、`sinyal crypto gratis`、`grup sinyal VIP`、`klaim airdrop gratis`、`hubungkan dompet`、`verifikasi dompet`、`kirim seed phrase`、`pulihkan dana yang hilang`、`bayar pajak untuk penarikan`。 `[TRANSLATION]`

### 3.3 色情、约会、成人站和骚扰引流

#### 简体中文 `zh-Hans`

`看片加我`、`看片私聊`、`福利在主页`、`主页看福利`、`主页有资源`、`资源私发`、`免费看片`、`同城上门`、`附近可约`、`同城可约`、`今晚可约`、`私信看照片`、`私信发你资源`、`加我看更多`、`看我置顶`、`只入身体`、`玩归玩闹归闹`、`比她好看的没她骚`、`比她骚的没她好看`、`比我骚的没我好看`、`刷了半天的就她的主页能打`、`我福不黑不信你看`、`有人想锐评一下我的福`、`应该没人比我玩的开了吧`、`AI裸照生成`、`裸照一键生成`。 `[USER-SEED][TRANSLATION]`

#### 繁体中文 `zh-Hant`

`看片加我`、`福利在主頁`、`主頁有資源`、`同城可約`、`附近可約`、`今晚可約`、`私訊看照片`、`加我看更多`、`看我置頂`、`外送茶`、`約炮加賴`。 `[USER-SEED][TRANSLATION]`

#### English `en`

`nudes in my bio`、`free nudes in bio`、`see more in my bio`、`exclusive content in bio`、`adult content in bio`、`private content link`、`DM for private content`、`DM me for nudes`、`meet me tonight`、`hookup near you`、`local girls near you`、`click for uncensored`、`my OnlyFans is free`、`free trial in bio`、`18+ link in bio`、`see my pinned post`、`rate my body`、`would you smash`、`sugar daddy needed`、`sugar baby needed`。 `[COMMUNITY][TRANSLATION]`

#### 日本語 `ja`

`プロフに動画`、`プロフにえち動画`、`プロフから見て`、`固定に動画あります`、`裏垢女子と繋がりたい`、`DMで会いたい人募集`、`会いたい人DMきて`、`仲良くなったら会いたい`、`今夜会える人`、`近くで会える人`、`無料で見せます`、`無修正はプロフ`、`続きはプロフ`、`えちな写真は固定`、`秘密の動画`、`セフレ募集中`、`パパ活募集中`。 `[X-OBS][TRANSLATION]`

#### 한국어 `ko`

`야한 사진은 프로필`、`성인 영상은 프로필`、`무료 야동 링크`、`더 많은 사진은 프로필`、`DM으로 사진 보내줄게`、`오늘 만날 사람`、`근처에서 만나요`、`조건만남 문의`、`오빠 DM 줘`、`비공개 영상 링크`、`19금 링크는 프로필`。 `[TRANSLATION]`

#### Español `es`

`fotos íntimas en mi perfil`、`contenido para adultos en mi bio`、`contenido exclusivo en mi bio`、`vídeos gratis en mi perfil`、`manda DM para fotos`、`quedamos esta noche`、`chicas cerca de ti`、`encuentros cerca de ti`、`mira mi publicación fijada`、`contenido sin censura`、`prueba gratis en mi bio`、`busco sugar daddy`。 `[TRANSLATION]`

#### Português `pt`

`conteúdo adulto na bio`、`fotos privadas no perfil`、`vídeos grátis na bio`、`chama no direct para fotos`、`encontro hoje à noite`、`garotas perto de você`、`conteúdo sem censura`、`teste grátis na bio`、`procuro sugar daddy`。 `[TRANSLATION]`

### 3.4 恢复服务冒充和客服回复诈骗

这一类常出现在用户公开求助“钱包转错、账户被盗、交易失败”的回复下。论文和公开 X 资料显示，骗子通常先在 X 回复，再将受害者转移到 DM、Telegram、Instagram 或邮件。

`contact the recovery team`、`recovery expert helped me`、`I can help recover your funds`、`there is still a chance to recover`、`you don't deserve this loss`、`DM me for recovery support`、`kindly inbox the support team`、`message the admin on Telegram`、`contact support on WhatsApp`、`wallet rectification`、`wallet synchronization`、`wallet validation portal`、`资金追回团队`、`专业追回被骗资金`、`私信客服处理`、`联系技术团队恢复`、`被害金回収サポート`、`DMで復旧できます`、`피해금 복구 전문가`、`복구팀에 DM`、`equipo de recuperación`、`recuperación de fondos robados`。 `[X-OBS][RESEARCH][TRANSLATION]`

## 4. B 级：建议用户自选

以下词能提升拦截率，但正常内容中也很常见。UI 应默认不选，并显示“可能误伤正常讨论”。

### 广告与互动

`互粉`、`互关`、`涨粉`、`引流`、`接推广`、`商务合作`、`免费领取`、`限时领取`、`日结`、`副业`、`兼职`、`在家赚钱`、`link in bio`、`check my bio`、`DM me`、`giveaway`、`free giveaway`、`follow back`、`paid promo`、`side hustle`、`相互フォロー`、`フォロバ`、`副業`、`在宅ワーク`、`맞팔`、`재택부업`、`sígueme`、`enlace en bio`、`renda extra`。 `[USER-SEED][COMMUNITY][TRANSLATION]`

### 投资与加密

`加密货币`、`比特币`、`A股`、`牛股`、`荐股`、`带单`、`跟单`、`空投`、`套利`、`被动收入`、`财富自由`、`crypto`、`bitcoin`、`airdrop`、`presale`、`trading signals`、`passive income`、`financial freedom`、`wallet recovery`、`seed phrase`、`pump and dump`、`投資グループ`、`急騰銘柄`、`暗号資産`、`리딩방`、`급등주`、`에어드롭`、`criptomonedas`、`señales de trading`、`libertad financiera`。 `[USER-SEED][GOV][RESEARCH]`

### 成人与约会

`福利`、`看片`、`少妇`、`附近`、`搭子`、`主人`、`弟弟`、`小姐`、`小狗`、`日本美女`、`成人内容`、`裸照`、`OnlyFans`、`Fansly`、`nudes`、`NSFW`、`hookup`、`sugar daddy`、`裏垢女子`、`裏アカ`、`会いたい`、`セフレ`、`パパ活`、`조건만남`、`야동`、`contenido adulto`、`sin censura`。 `[USER-SEED][X-OBS][TRANSLATION]`

## 5. C 级：禁止作为默认单词

`狗`、`币`、`福`、`资`、`线下`、`同城`、`附近`、`弟弟`、`主人`、`小姐`、`春节`、`春晚`、`VPN`、`eSIM`、`DeepSeek`、`crypto`、`coin`、`token`、`wallet`、`DM`、`LINE`、`Telegram`、`WhatsApp`、`投資`、`株`、`副業`、`무료`、`수익`、`dinero`、`inversión`。

原因：这些词可能大量出现在新闻、技术、生活、宠物、金融教育或正常社交内容中。未来若产品支持组合规则，可采用例如：

- `LINE` + `無料` + `銘柄`
- `wallet` + `validate/connect` + `claim`
- `Telegram` + `guaranteed returns/signals`
- `同城/附近` + `上门/可约/看片`
- `프로필` + `19금/영상/링크`

## 6. 不建议纳入的现有种子

- **真实姓名或公众人物名**：张雪峰、罗永浩、夏河等。屏蔽对象应由用户自己决定，不属于通用垃圾词库。
- **地点和商业设施**：万达广场、香港银行卡。它们可能是某一波垃圾内容的特征，但时效性强且误杀正常本地内容。
- **热点词**：春晚、春节、DeepSeek。适合“临时热点过滤”分类并设置 24 小时、7 天或 30 天，不适合永久默认词库。
- **普通名词**：狗、福、币、资、附近、线下。必须删除或降为组合信号。
- **情绪句**：`我真顶不住`、`说个暴论`、`暴论`。正常中文使用频率高，只适合个人偏好库。

## 7. 建议产品分类结构

1. `ads-engagement`：推广、互粉、导流、兼职、课程。
2. `crypto-investment-scam`：高收益、荐股、拉盘、空投、假投资群。
3. `recovery-support-scam`：钱包恢复、资金追回、冒充客服。
4. `adult-dating-spam`：成人站、约会、同城上门、主页色情引流。
5. `harassment-comment-bait`：挑逗、身体评价、福系评论区复制话术。
6. `temporary-trends`：热点、节日、活动，只建议 24 小时至 30 天。
7. `personal-opt-in`：人物、品牌、地点和用户自定义词，永不默认勾选。

每个词条建议最终采用结构化数据，而不是仅用 Markdown 标题和逗号：

```json
{
  "keyword": "connect wallet to claim",
  "category": "crypto-investment-scam",
  "language": "en",
  "risk": "A",
  "defaultSelected": true,
  "sourceTypes": ["RESEARCH", "X-OBS"]
}
```

`keywords.md` 可以作为面向人的展示文件；脚本实际加载建议改用 `keywords.json`，这样分类、语言、风险、默认选择和来源不会在解析时丢失。

## 8. 数据质量与局限

- **较高置信度**：日语投资回复垃圾、英语钱包恢复/验证、韩语投资群、中文“福系”复制句，均有明确模式或公开案例支持。
- **中等置信度**：广告互动和成人引流短语在多个社媒平台共通，但并非每条都由 X 页面直接采样。
- **待母语复核**：法语、德语、印尼语及部分韩语/西语扩展是诈骗语义翻译，不应在未经测试时默认全选。
- **时效性**：垃圾话术会主动变体、插空格、混用全角字符、同形字和 emoji。纯关键词库只能降低噪音，不能替代举报、账号屏蔽和平台风控。
- **匹配限制**：X 搜索仍会显示命中内容；屏蔽词只能影响 Home、Notifications 和回复相关展示。
- **误杀控制**：A 级也应允许逐类取消；B/C 级必须显式选择。人物、地点、品牌和单字不应随远程更新自动加入。

## 9. 主要公开来源

1. X Help Center, Advanced muting options: https://help.x.com/en/using-x/advanced-x-mute-options
2. X 公开帖子（日语投资垃圾短语样本）: https://x.com/ishikawa84g/status/1899893203278717382
3. ITmedia（日语 X 投资回复垃圾原文与变体）: https://www.itmedia.co.jp/news/article/2503/12/1250312199/
4. Impress Watch（日语“言及したブロガー”回复垃圾）: https://www.watch.impress.co.jp/docs/topic/2008215.html
5. 日本警察厅 SNS 型投资诈骗: https://www.npa.go.jp/bureau/safetylife/sos47/case/sns-romance/investment/
6. 日本金融厅 SNS 投资诱导手法: https://www.fsa.go.jp/receipt/toushisagi_koukoku/shuhou.html
7. LINE Yahoo 投资诈骗说明: https://guide.line.me/ja/security/investmentfraud.html
8. 韩国政府政策简报，投资 리딩방 诈骗: https://www.korea.kr/multi/visualNewsView.do?newsId=148926749
9. 韩国日报，高收益/本金保证话术样本: https://www.hankookilbo.com/News/Read/A2024061810580000042
10. Australian Scamwatch, investment scam warning signs: https://www.scamwatch.gov.au/types-of-scams/investment-scams
11. Cryptocurrency manipulation across Twitter/Telegram/Discord: https://arxiv.org/abs/2001.10289
12. Cryptocurrency wallet recovery scams originating on Twitter: https://arxiv.org/abs/2401.09824
13. 公开 X “crypto recovery”账号样本: https://x.com/0racleTX
14. 日语“プロフ見て”引流说明: https://www.torablog.tech/look-at-profile/
15. 公开 X 日语成人/约会话术样本: https://x.com/amu_asmr/status/1952667651614089500
16. 开源 Twitter muted-word 项目（仅用来对比数据格式和误杀问题）: https://github.com/sindresorhus/twitter-mute-words
17. Chirp Silencer 公共列表格式说明: https://github.com/Etheonor/chirp-silencer
18. 社媒机器人“promote it on / send pic”公开社区样本（跨平台参考）: https://www.reddit.com/r/socialmedia/comments/11oze3t/leave_or_delete_spam_comments_on_insta/

## 10. 发布前最小验收建议

1. 从 A 级每种语言抽 5 条，在测试账号按 `Notifications + From anyone + 30 days` 添加。
2. 分别发布命中和不命中的测试回复，确认通知与 Home 行为，不用搜索页作为判断标准。
3. 用含普通语境的对照句测试误伤，例如 “wallet security”、正常股票新闻和正常约会讨论。
4. 移动端检查每个词条的 Home/Notifications、来源范围和期限显示是否与请求一致。
5. 测试完成后删除测试词；正式远程词库更新必须展示 diff 或版本号，不能静默增加人物、地点和 C 级词。
