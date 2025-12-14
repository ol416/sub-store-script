// 1. 解析输入的 YAML 配置，支持从 $content 或 $files[0] 读取
const config = ProxyUtils.yaml.safeLoad($content ?? $files[0]) || {};

// 2. 确保 config["proxy-groups"] 为数组
if (!Array.isArray(config["proxy-groups"])) {
  config["proxy-groups"] = [];
}

// 3. 定义要复制的来源策略组名称（根据需要修改）
const sourceGroupNames = ["\U0001F4F2 电报消息"];
// 4. 定义新策略组的名称
const newGroupName = "RockStarGame";

// 5. 遍历所有策略组，将符合条件的组中的 proxies 合并（去重）
const proxiesSet = new Set();
config["proxy-groups"].forEach(group => {
  if (sourceGroupNames.includes(group.name)) {
    if (Array.isArray(group.proxies)) {
      group.proxies.forEach(proxy => {
        proxiesSet.add(proxy);
      });
    }
  }
});

// 6. 生成新策略组的 proxies 数组
const newProxies = Array.from(proxiesSet);

// 7. 新建一个策略组对象，新组的 type 为 select，可根据需要调整
const newGroup = {
  name: newGroupName,
  type: "select",
  proxies: newProxies
};

// 8. 将新策略组添加到 proxy-groups 数组中
config["proxy-groups"].push(newGroup);

// 9. 将更新后的配置转换为 YAML 字符串（使用 forceQuotes 选项强制加双引号）
$content = ProxyUtils.yaml.dump(config, { forceQuotes: true });
