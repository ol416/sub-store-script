function operator(proxies = [], targetPlatform, context) {
  const $ = $substore;
  $.info("开始将节点类型写入节点名称...");
  
  proxies = proxies.map(proxy => {
    if (proxy.type && proxy.name) {
      // 如果节点名称中还没有包含 type 前缀，则进行添加
      if (!proxy.name.startsWith(proxy.type + "-")) {
        const oldName = proxy.name;
        proxy.name = `${proxy.name}-[${proxy.type}]`;
        $.info(`节点名称更新: "${oldName}" => "${proxy.name}"`);
      }
    }
    return proxy;
  });
  
  $.info("完成所有节点名称更新。");
  return proxies;
}
