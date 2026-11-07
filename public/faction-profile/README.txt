势力档案维护

统一模板：src/faction-archive.js、src/faction-archive.css。
数据入口：本目录 factions.json，数组中每个对象是一份势力档案。
新增势力只需增加对象，无需新增 HTML 或页面注册项。

id：唯一英文标识，用于 /faction-profile.html?id=标识 的直达链接。
name：势力名称。affiliation：归属。subtitle：简短副标题。
emblem：纹章图片路径；未填写或加载失败时显示星形占位。
emblemLayout：可选，填 banner 时按完整竖旗展示，省略则使用圆形纹章框。
emblemAlt：可选，图片的文字说明。
banners：可选，五个 {"src":"图片路径","alt":"旗帜名称"} 对象，依次从左到右展示；中央旗最大，两侧逐级缩小并叠放。
music：music-library.js 中的曲目 ID；未配置时使用百科背景音乐。
blocks：正文内容数组，支持以下格式：
  {"type":"key-value","key":"归属","value":"势力归属"}
  {"type":"heading","content":"章节标题"}
  {"type":"paragraph","content":"正文"}
  {"type":"quote","content":"引文","author":"署名"}
  {"type":"image","url":"/图片路径.webp","caption":"图片说明"}

百科入口与目录数量自动读取此数据。旧势力链接继续打开统一模板。
内容修改后运行 npm run fonts:sync 和 npm run fonts:check，更新字体优先加载包。
旧版独立页面已备份至项目 design/faction-pages-archive，未删除原始美术资源。
