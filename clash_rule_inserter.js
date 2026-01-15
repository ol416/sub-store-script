/**
 * 脚本目标：插入 Clash 自定义规则 (rule-providers 和对应 rules)
 */

// #################################################################
// ## ⚙️ 用户配置区域 (集中配置，只需修改下方变量)
// #################################################################

// 1. rule-providers 文件名列表 (字段固定 'rule-providers')
const PROVIDER_CONFIGS = [
    'rule-providers',
    // 可添加更多文件名，例如：
    // 'another-rule-providers'
];

// 2. 自定义规则配置文件名列表 (字段固定 'rules', 用于提供自定义 RULE-SET 值 {providerKey: 'ruleValue'})
const RULES_CONFIGS = [
    'ruleValue'  // 可添加文件名，从中获取 {providerKey: 'ruleValue'} 对象
];

// 3. 策略占位符 (用于 RULE-SET 规则)
const POLICY_PLACEHOLDER = 'REPLACE_ME';

// #################################################################
// ## 📝 脚本执行区域 (以下无需修改)
// #################################################################

/**
 * 插入 Clash rule-providers 和对应 RULE-SET rules 的函数
 * @param {object} yaml - 解析后的 YAML 对象
 * @param {object} providersMap - rule-providers 数据对象
 * @param {string} policyPlaceholder - 策略占位符
 * @param {object} customRulesMap - 自定义规则映射 {providerKey: 'ruleValue'}
 */
function insertCustomRules(yaml, providersMap, policyPlaceholder, customRulesMap = {}) {
    console.log('insertCustomRules 开始，yaml rule-providers keys:', Object.keys(yaml['rule-providers'] || {}));
    if (providersMap && typeof providersMap === 'object') {
        // 初始化节点防止报错
        if (!yaml['rule-providers']) yaml['rule-providers'] = {};
        if (!yaml.rules) yaml.rules = [];

        const newRules = [];

        // 遍历并检查重复
        Object.keys(providersMap).forEach(key => {
            // 检查 rule-providers 是否已存在
            if (yaml['rule-providers'][key]) {
                console.log(`[Skip] rule-provider 已存在: ${key}`);
            } else {
                // 不存在则写入
                yaml['rule-providers'][key] = providersMap[key];
                console.log(`✅ 插入 rule-provider: ${key}`);
            }

            // 检查 rules 中是否已存在引用该 Provider 的 RULE-SET
            const isRuleExisted = yaml.rules.some(rule =>
                typeof rule === 'string' && rule.includes(`RULE-SET,${key},`)
            );

            if (isRuleExisted) {
                console.log(`[Skip] rules 中已存在对 ${key} 的引用`);
            } else {
                // 只有不存在时才加入待插入队列，使用自定义规则或默认占位符
                const ruleValue = customRulesMap[key] || policyPlaceholder;
                newRules.push(`RULE-SET,${key},${ruleValue}`);
            }
        });

        // 将不重复的规则插入到顶部
        if (newRules.length > 0) {
            yaml.rules.unshift(...newRules);
        }
    }
    console.log('insertCustomRules 结束，yaml rule-providers keys:', Object.keys(yaml['rule-providers'] || {}));
}

/**
 * 插入自定义 rules 的函数
 * @param {object} yaml - 解析后的 YAML 对象
 * @param {array} rulesArray - rules 数组
 */
function insertCustomRulesFromArray(yaml, rulesArray) {
    if (Array.isArray(rulesArray)) {
        if (!yaml.rules) yaml.rules = [];

        const newRules = [];

        // 检查重复
        rulesArray.forEach(rule => {
            if (!yaml.rules.includes(rule)) {
                newRules.push(rule);
            } else {
                console.log(`[Skip] rule 已存在: ${rule}`);
            }
        });

        // 插入到顶部
        if (newRules.length > 0) {
            yaml.rules.unshift(...newRules);
        }
    }
}

// 主执行逻辑
console.log('[Debug] 检查全局变量: $content =', typeof $content, '$files =', typeof $files);
if (typeof $content === 'undefined' && (typeof $files === 'undefined' || !$files[0])) {
    throw new Error('Sub-Store 环境变量 $content 或 $files 未定义。请确保在正确的上下文中运行脚本。');
}
const yaml = ProxyUtils.yaml.safeLoad($content ?? $files[0]);

// 获取自定义规则映射
let customRulesMap = {};
for (const fileName of RULES_CONFIGS) {
    console.log(`⏳ 正在获取自定义规则文件: ${fileName}...`);
    let rulesString = await produceArtifact({
        type: 'file',
        name: fileName,
    });
    const additionalRules = ProxyUtils.yaml.safeLoad(rulesString);
    const rulesArray = additionalRules['rules'] || additionalRules;
    if (Array.isArray(rulesArray)) {
        // 从 rules 数组中解析 RULE-SET,key,value 格式
        rulesArray.forEach(rule => {
            if (typeof rule === 'string' && rule.startsWith('RULE-SET,')) {
                const parts = rule.split(',');
                if (parts.length >= 3) {
                    const key = parts[1];
                    const value = parts[2];
                    customRulesMap[key] = value;
                }
            }
        });
        console.log(`   - 从 ${rulesArray.length} 个规则中解析到 ${Object.keys(customRulesMap).length} 个自定义 RULE-SET 映射。`);
    } else {
        console.log(`   - 警告：文件 ${fileName} 的格式不是预期的数组，已跳过。`);
    }
}

// 处理 rule-providers
for (const fileName of PROVIDER_CONFIGS) {
    console.log(`⏳ 正在获取 rule-providers 文件: ${fileName}...`);
    let providersString = await produceArtifact({
        type: 'file',
        name: fileName,
    });
    console.log(`   - 获取到 providersString 长度: ${providersString.length}`);
    const additionalProviders = ProxyUtils.yaml.safeLoad(providersString);
    console.log(`   - 解析后 additionalProviders keys:`, Object.keys(additionalProviders));
    const providersMap = additionalProviders['rule-providers'] || additionalProviders;
    console.log(`   - providersMap keys:`, Object.keys(providersMap));
    if (providersMap && typeof providersMap === 'object') {
        console.log(`   - 获取到 ${Object.keys(providersMap).length} 个 rule-provider。`);
        // 调用封装函数
        insertCustomRules(yaml, providersMap, POLICY_PLACEHOLDER, customRulesMap);
    } else {
        console.log(`   - 警告：文件 ${fileName} 的格式不是预期的对象，已跳过。`);
    }
}



// 输出结果
$content = ProxyUtils.yaml.dump(yaml);
console.log('最终 $content 长度:', $content.length);