param(
  [string]$Source = (Join-Path $PSScriptRoot '..\keywords-research-sol.md'),
  [string]$Output = (Join-Path $PSScriptRoot '..\keywords.md')
)

$lines = Get-Content -LiteralPath $Source -Encoding UTF8
$result = [System.Collections.Generic.List[string]]::new()
$result.Add('# X Keywords Blocker 远程词库')
$result.Add('')
$result.Add('> 自动生成自 `keywords-research-sol.md`。三级标题是分类，四级标题是说明，只有反引号中的列表项会被脚本加载。')
$result.Add('')

$categoryMap = @{
  '### 3.1 ' = '### A 默认 · 广告、引流、涨粉和互动诱饵'
  '### 3.2 ' = '### A 默认 · 加密、投资、赌博和快速赚钱诈骗'
  '### 3.3 ' = '### A 默认 · 色情、约会、成人站和骚扰引流'
  '### 3.4 ' = '### A 默认 · 恢复服务冒充和客服回复诈骗'
}

$active = $false
$hasDescription = $false
foreach ($line in $lines) {
  if ($line -like '## 4.*') { break }
  $matchedCategory = $null
  foreach ($prefix in $categoryMap.Keys) {
    if ($line.StartsWith($prefix)) { $matchedCategory = $categoryMap[$prefix]; break }
  }
  if ($matchedCategory) {
    $active = $true
    $hasDescription = $false
    $result.Add($matchedCategory)
    $result.Add('')
    continue
  }
  if (-not $active) { continue }
  if ($line.StartsWith('#### ')) {
    $description = $line.Substring(5).Trim()
    $result.Add("#### $description · 高置信度，建议默认展示")
    $result.Add('')
    $hasDescription = $true
    continue
  }
  $matches = [regex]::Matches($line, '`([^`]+)`')
  if ($matches.Count -gt 0 -and -not $hasDescription) {
    $result.Add('#### 多语言高置信度短语 · 建议默认展示')
    $result.Add('')
    $hasDescription = $true
  }
  foreach ($match in $matches) {
    $word = $match.Groups[1].Value.Trim()
    if ($word -and $word -notmatch '^\[.+\]$') { $result.Add("- ``$word``") }
  }
  if ($matches.Count -gt 0) { $result.Add('') }
}

$result.Add('### B 自选 · 广告、互动和副业泛词')
$result.Add('')
$result.Add('#### 可能误伤正常讨论，默认不应自动勾选')
$result.Add('')
$result.AddRange([string[]]@(
  '- `互粉`','- `互关`','- `涨粉`','- `引流`','- `接推广`','- `商务合作`','- `免费领取`','- `限时领取`','- `日结`','- `副业`','- `兼职`','- `在家赚钱`','- `link in bio`','- `check my bio`','- `DM me`','- `giveaway`','- `follow back`','- `paid promo`','- `side hustle`','- `相互フォロー`','- `フォロバ`','- `副業`','- `在宅ワーク`','- `맞팔`','- `재택부업`','- `sígueme`','- `enlace en bio`','- `renda extra`'
))
$result.Add('')
$result.Add('### B 自选 · 投资与加密泛词')
$result.Add('')
$result.Add('#### 适合关注反诈内容较少的用户自行选择')
$result.Add('')
$result.AddRange([string[]]@(
  '- `加密货币`','- `比特币`','- `A股`','- `牛股`','- `荐股`','- `带单`','- `跟单`','- `空投`','- `套利`','- `被动收入`','- `财富自由`','- `crypto`','- `bitcoin`','- `airdrop`','- `presale`','- `trading signals`','- `passive income`','- `financial freedom`','- `wallet recovery`','- `seed phrase`','- `pump and dump`','- `投資グループ`','- `急騰銘柄`','- `暗号資産`','- `리딩방`','- `급등주`','- `에어드롭`','- `criptomonedas`','- `señales de trading`','- `libertad financiera`'
))
$result.Add('')
$result.Add('### B 自选 · 成人与约会泛词')
$result.Add('')
$result.Add('#### 正常语境中也可能出现，请谨慎选择')
$result.Add('')
$result.AddRange([string[]]@(
  '- `福利`','- `看片`','- `少妇`','- `搭子`','- `成人内容`','- `裸照`','- `OnlyFans`','- `Fansly`','- `nudes`','- `NSFW`','- `hookup`','- `sugar daddy`','- `裏垢女子`','- `裏アカ`','- `会いたい`','- `セフレ`','- `パパ活`','- `조건만남`','- `야동`','- `contenido adulto`','- `sin censura`'
))
$result.Add('')

$content = ($result -join "`n").TrimEnd() + "`n"
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($Output), $content, [System.Text.UTF8Encoding]::new($false))
