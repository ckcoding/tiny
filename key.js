const fs = require('fs');
const path = require('path');
const colors = require('colors');
const keyPath = path.join(__dirname, 'config', 'keys.txt');
    // if (!fs.existsSync(keyPath)) {
    //     // 如果不存在，则创建文件夹
    //     fs.mkdirSync(keyPath, { recursive: true });
    // }
// 从文件中读取 Key 信息
function readKeysFromFile(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    if(content){
        const lines = content.split('\n');
        const keys = lines.map(line => {
            if (line){
                const [key, remainingUses] = line.split('?');
                return { key, remainingUses: parseInt(remainingUses) };
            }
            return null;
        });
        return keys;
    }
    return []
}

// 获取可用的 Key
function getKey(keys) {
    for (const keyInfo of keys) {
        if (keyInfo.remainingUses < 500 && keyInfo.key) {
            keyInfo.remainingUses++;
            return keyInfo.key;
        }
    }
    return null; // 没有可用的 Key
}

function keyToUse(){
    let keys = readKeysFromFile(keyPath);
    const keyToUse = getKey(keys);
    if(keyToUse) updateKeyFile(keys);
    return keyToUse
}

// 更新 Key 文件中的信息
function updateKeyFile(keys) {
    
    const content = keys.map(({ key, remainingUses }) => `${key}?${remainingUses}`).join('\n');
    fs.writeFileSync(keyPath, content, 'utf-8');
}

function setKey(key){
    
    let keys = readKeysFromFile(keyPath);
    //如果key存在，则不设置，返回key存在
    let keyInfo = keys.find(item => item?.key == key)
    if(keyInfo){
        return `设置失败，当前key已存在`.red
    }else{
        keys.push({key,remainingUses:0})
        updateKeyFile(keys);
        return `${'设置成功，当前key为'.yellow} ${key.green}`
    }
}

//查看所有key的使用情况
function lsKey(){
    
    let keys = readKeysFromFile(keyPath);
    let table = ``
    keys.forEach(item => {
        table += `当前key: ${item.key.green} 已用次数: ${String(item.remainingUses).green}\n`
    })
    return table.toString() || `当前key列表为空`.red
}
//删除某个key
function clearKey(key){
    
    let keys = readKeysFromFile(keyPath);
    let index = keys.findIndex(item => item?.key == key)
    if(index != -1){
        keys.splice(index,1)
        updateKeyFile(keys);
        return `删除成功`.green
    }else{
        return `删除失败，当前key不存在`.red
    }
}
module.exports = { keyToUse,updateKeyFile,setKey,lsKey,clearKey};