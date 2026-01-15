# Sub-Store Scripts

[![Sub-Store](https://img.shields.io/badge/Sub--Store-Compatible-green.svg)](https://github.com/sub-store-org/Sub-Store)

## 简介

专为 [Sub-Store](https://github.com/sub-store-org/Sub-Store) 设计的Clash配置管理脚本集合，提供节点管理、订阅处理、策略组操作等功能。

## 脚本功能

### 核心脚本

- **`clash_rule_inserter.js`** - 插入 Clash 自定义规则，支持 rule-providers 和 rules 配置
- **`insert_custom_node_group.js`** - 从多个订阅源获取节点并添加到指定策略组顶部
- **`copy_new_groups.js`** - 复制策略组中的节点创建新组
- **`insert_new_proxies.js`** - 将策略组名称插入到其他策略组中
- **`set_type_group.js`** - 根据节点类型自动创建策略组
- **`insert_custom_node.js`** - 简化版单个订阅源节点插入

### 订阅处理脚本 (sub/ 目录)

- **`节点风险检测.js`** - 检测并过滤风险IP节点
- **`set_type_name.js`** - 将节点类型添加到节点名称中

## 使用方法

1. 在Sub-Store中导入脚本文件
2. 根据需要修改脚本中的配置参数
3. 在订阅处理流程中添加相应脚本


## 许可证

MIT License