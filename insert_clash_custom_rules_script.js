const yaml = ProxyUtils.yaml.safeLoad($content ?? $files[0])

// 1. 获取并解析外部 rule-providers
let providersString = await produceArtifact({
    type: 'file',
    name: 'rule-providers',
})
const additionalProviders = ProxyUtils.yaml.safeLoad(providersString)
const providersMap = additionalProviders['rule-providers'] || additionalProviders

if (providersMap && typeof providersMap === 'object') {
    // 初始化节点防止报错
    if (!yaml['rule-providers']) yaml['rule-providers'] = {}
    if (!yaml.rules) yaml.rules = []

    const policyPlaceholder = "REPLACE_ME"
    const newRules = []

    // 2. 遍历并检查重复
    Object.keys(providersMap).forEach(key => {
        // --- 检查 rule-providers 是否已存在 ---
        if (yaml['rule-providers'][key]) {
            console.log(`[Skip] rule-provider 已存在: ${key}`);
        } else {
            // 不存在则写入
            yaml['rule-providers'][key] = providersMap[key];
        }

        // --- 检查 rules 中是否已存在引用该 Provider 的 RULE-SET ---
        // 逻辑：遍历当前 rules，看是否有字符串包含 "RULE-SET,key,"
        const isRuleExisted = yaml.rules.some(rule => 
            typeof rule === 'string' && rule.includes(`RULE-SET,${key},`)
        );

        if (isRuleExisted) {
            console.log(`[Skip] rules 中已存在对 ${key} 的引用`);
        } else {
            // 只有不存在时才加入待插入队列
            newRules.push(`RULE-SET,${key},${policyPlaceholder}`);
        }
    });

    // 3. 将不重复的规则插入到顶部
    if (newRules.length > 0) {
        yaml.rules.unshift(...newRules);
    }
}

// 4. 输出结果
$content = ProxyUtils.yaml.dump(yaml)