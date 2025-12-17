/**
 * 脚本目标：从【多个订阅源】获取新节点，并将其加入到主配置和指定的策略组【顶部】。
 */

// #################################################################
// ## ⚙️ 用户配置区域 (集中配置，只需修改下方变量)
// #################################################################

// 1. 【订阅配置】定义要获取新节点的订阅源信息 (可以添加多个对象)
// ⚠️ 注意：每个对象都代表一个要处理的订阅源
const SUBSCRIPTION_CONFIGS = [
    {
        name: 'RackNerd',      // 第一个订阅源的名称
        platform: 'ClashMeta', 
        produceType: 'internal'
    },
    // {
    //     name: 'My-SingBox-Sub', // 第二个订阅源的名称 (假设是 SingBox 节点)
    //     platform: 'sing-box', 
    //     produceType: 'internal'
    // }
    // 您可以继续添加更多订阅源配置...
];

// 2. 【策略组配置】定义要添加这些新节点名称的策略组列表
// 请根据您的 Clash 配置文件，修改此数组中的名称。
const TARGET_GROUP_NAMES = ['🔀 手动切换',"🔐 Vless"]; 

// #################################################################
// ## 📝 脚本执行区域 (以下无需修改)
// #################################################################


// --- 步骤 1: 加载配置并获取所有新节点 ---

// 1.1 加载现有的 YAML 配置 (从 $content 或 $files[0])
const yaml = ProxyUtils.yaml.safeLoad($content ?? $files[0])

// 1.2 遍历所有订阅源配置，获取并合并所有新节点
let allNewProxies = [];
for (const subConfig of SUBSCRIPTION_CONFIGS) {
    console.log(`⏳ 正在获取订阅源: ${subConfig.name}...`);
    
    let currentProxies = await produceArtifact({
        type: 'subscription',
        ...subConfig // 使用当前订阅配置
    });
    
    // 确保获取到的节点是数组
    if (Array.isArray(currentProxies)) {
        allNewProxies.push(...currentProxies);
        console.log(`   - 获取到 ${currentProxies.length} 个节点。`);
    } else {
        console.log(`   - 警告：订阅源 ${subConfig.name} 返回的格式不是预期的节点数组，已跳过。`);
    }
}

// 1.3 提取【所有】新节点的名称列表 (去重发生在步骤 3)
const allNewProxyNames = allNewProxies
    .map(p => p.name)
    .filter(name => name) // 确保名称有效


// --- 步骤 2: 更新 'proxies' 列表 ---

// 2.1 将所有新节点添加到主配置的 proxies 列表的开头
if (!Array.isArray(yaml.proxies)) {
    yaml.proxies = [];
}
yaml.proxies.unshift(...allNewProxies)
console.log(`✅ 已将总计 ${allNewProxies.length} 个新节点添加到 'proxies' 列表。`);


// --- 步骤 3: 更新指定的 'proxy-groups' (将新节点置于顶部) ---

// 3.1 遍历并更新指定的 proxy-groups
if (Array.isArray(yaml['proxy-groups'])) {
    
    // 准备新节点的 Set 结构，用于快速判断和去重
    const allNewProxyNamesSet = new Set(allNewProxyNames);
    
    yaml['proxy-groups'].forEach(group => {
        // 检查当前策略组是否在目标列表中，且具有 proxies 字段
        if (TARGET_GROUP_NAMES.includes(group.name) && Array.isArray(group.proxies)) {
            
            // 3.2 过滤掉旧列表中所有与新节点重名的项，以避免重复
            const remainingProxies = group.proxies.filter(name => !allNewProxyNamesSet.has(name));
            
            // 3.3 将新的节点列表放在最前面，然后接上剩余的旧节点，实现置顶
            group.proxies = [...allNewProxyNames, ...remainingProxies];
            
            // 3.4 统计并输出日志
            console.log(`✅ 已将所有 ${allNewProxyNames.length} 个新节点置于策略组 [${group.name}] 顶部。`);
        }
    });
} else {
    // 如果 proxy-groups 不存在
    console.log('⚠️ 配置中未找到 proxy-groups 列表，跳过更新策略组。');
}


// --- 步骤 4: 输出最终配置 ---

// 4.1 将更新后的配置对象转换为 YAML 字符串，作为最终输出
$content = ProxyUtils.yaml.dump(yaml)