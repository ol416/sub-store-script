// 解析输入的 YAML 配置，支持从 $content 或 $files[0] 读取
const config = ProxyUtils.yaml.safeLoad($content ?? $files[0]) || {};

// 确保 proxies 字段为数组（若不存在，则初始化为空数组）
if (!Array.isArray(config.proxies)) {
  config.proxies = [];
}

// 根据节点的 type 属性分组，构造一个字典：{ type: [proxyName1, proxyName2, ...] }
const groupsByType = {};
config.proxies.forEach(proxy => {
  // 仅处理同时具备 type 和 name 字段的节点
  if (proxy.type && proxy.name) {
    const key = proxy.type;
    if (!groupsByType[key]) {
      groupsByType[key] = [];
    }
    // 避免重复添加同一节点名称
    if (!groupsByType[key].includes(proxy.name)) {
      groupsByType[key].push(proxy.name);
    }
  }
});

// 确保 proxy-groups 字段为数组（若不存在，则初始化为空数组）
if (!Array.isArray(config["proxy-groups"])) {
  config["proxy-groups"] = [];
}

// 对每个分组创建策略组，策略组采用 type: 'select'
Object.keys(groupsByType).forEach(groupName => {
  const groupObj = {
    name: groupName,
    type: "select",
    proxies: groupsByType[groupName]
  };

  // 检查是否已有同名的策略组，若存在则更新，否则新增
  const idx = config["proxy-groups"].findIndex(g => g.name === groupName);
  if (idx >= 0) {
    config["proxy-groups"][idx] = groupObj;
  } else {
    config["proxy-groups"].push(groupObj);
  }
});

// 将更新后的配置对象转换为 YAML 字符串，作为最终输出
$content = ProxyUtils.yaml.dump(config);
