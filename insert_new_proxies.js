/**
 * 脚本功能：
 * 1. 将指定的策略组名称插入到其他策略组的 proxies 中。
 * 2. 可选择性跳过名称中包含【选择、切换、节点】的策略组（仅识别策略组的 name）。
 * 3. 强制让插入的策略组名称在 YAML 输出中以双引号显示。
 * 4. 增加日志输出，方便调试。
 */
async function operator(proxies = [], targetPlatform, context) {
  const $ = $substore;
  $.info("开始插入指定的策略组...");

  // 解析 YAML 配置，支持从 $content 或 $files[0] 读取
  const config = ProxyUtils.yaml.safeLoad($content ?? $files[0]) || {};

  // 定义要插入的策略组名称（原始名称，不含双引号）
  const groupsToInsertRaw = [
    "ss",
    "vmess"
    // 根据需要增加更多策略组名称
  ];
  // 使用特殊标记包装，后续通过正则转换为双引号
  const groupsToInsert = groupsToInsertRaw.map(name => `@@${name}@@`);

  // 定义排除关键词：仅检查策略组的 name 部分
  const excludedKeywords = ["选择", "切换", "节点"];
  // 是否跳过名称中包含排除关键词的策略组（true：跳过）
  const skipExcluded = true;

  // 确保 proxy-groups 字段为数组
  if (!Array.isArray(config["proxy-groups"])) {
    config["proxy-groups"] = [];
  }

  // 遍历每个策略组，将指定的策略组名称插入到其 proxies 数组中（避免重复）
  config["proxy-groups"].forEach(group => {
    // 检查策略组的 name 部分是否包含排除关键词
    if (skipExcluded) {
      const containsExcluded = excludedKeywords.some(keyword => group.name.includes(keyword));
      if (containsExcluded) {
        $.info(`跳过策略组: ${group.name} (包含排除关键词)`);
        return;
      }
    }
    if (!Array.isArray(group.proxies)) {
      group.proxies = [];
    }
    groupsToInsert.forEach(insertName => {
      if (!group.proxies.includes(insertName)) {
        group.proxies.push(insertName);
        $.info(`在策略组 "${group.name}" 中插入策略组: ${insertName}`);
      }
    });
  });

  // 输出更新前的 YAML 配置（用于调试）
  $.info("更新前的 YAML 配置:");
  $.info(ProxyUtils.yaml.dump(config));

  // 将更新后的配置对象转换为 YAML 字符串
  let output = ProxyUtils.yaml.dump(config);

  // 使用正则替换，将特殊标记 @@...@@ 替换为带双引号的字符串
  output = output.replace(/@@(.*?)@@/g, function(match, p1) {
    return `"${p1}"`;
  });

  $.info("完成插入指定策略组，生成新的 YAML 配置。");
  $content = output;
  return proxies;
}
