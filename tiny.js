const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const tinify = require('tinify');
const Spinner = require("cli-spinner").Spinner;
const colors = require('colors');
const Table = require('cli-table2');
const keyFIle =  require(path.join(__dirname, 'key.js'))
const {keyToUse,setKey,lsKey,clearKey} = keyFIle //获取可用的key，更新key文件
const table = new Table({
  head: ['图片'.cyan, '原始'.cyan, '压缩后'.cyan, '压缩比例'.cyan, '结果'.cyan],
  colWidths: [null, null, null, null, null], // 根据实际情况调整列宽
  colAligns: ['center', 'center', 'center', 'center', 'center'] // 居中对齐
});


//拿到当前路径
let currentPath = process.cwd();
class Tiny {
	constructor(selector) {
		this.key  = 'key'
		this.fileName = null
		this.beforeSize = 0; //压缩前Bety
		this.afterSize = 0; //压缩后Bety
		this.success = 0; //成功
		this.fail = 0; //失败
		this.skip = 0; //跳过
	}
	getKey(){
		//拿到所有的key，如果没有就报错请先设置key
		let key = keyToUse()
		if(key == null){
			this.key = null
			return null
		}
		return key
	}
	//压缩图片
	async compress(image) {
		let beforeSize = fs.statSync(image).size;
		this.beforeSize = this.beforeSize + beforeSize;


		// let md5Path = path.join(__dirname, 'logs', 'md5.txt');
		// let md5Arr = fs.readFileSync(md5Path, 'utf-8').split('\n');
		//如果图片的md5值在md5Arr中，就不压缩
		// if (md5Arr.includes(this.getMd5(image))) {
		// 	this.notify(image,beforeSize,'--','跳过');
		// 	this.afterSize = this.afterSize + beforeSize;
		// 	++this.skip
		// 	return image + '已压缩，无需重复压缩';
		// }
		let spinner = new Spinner(`${image}  正在压缩中... %s`);
		spinner.setSpinnerString("|/-\\");
		spinner.start();
		let key =  this.getKey();
		this.key = key
		if(key == null){
			spinner.stop(true);
			++this.fail
			this.notify(this.fileName,beforeSize,beforeSize,'无可用key');
			return
		}
		tinify.key = key;
		const source = tinify.fromFile(image);
		let msg = ''
		let tabMsg = ''
		try{
			//压缩超过30秒，就报错
			let timer = setTimeout(() => {
				spinner.stop(true);
				msg =  image + '压缩超时'
				tabMsg = '压缩超时'
				++this.fail
				this.key = null
				this.notify(this.fileName,beforeSize,beforeSize,tabMsg);
			}, 15000);
			clearTimeout(timer)
			await source.toFile(image)
			msg =  image + '压缩成功'
			tabMsg = '成功'
			++this.success
			//追加写入记录
			// let writePath = path.join(__dirname, 'logs', 'md5.txt');
			// fs.writeFileSync(writePath, this.getMd5(image) + '\n', {flag: 'a'});
		}catch(e){
			let status = e.status
			let msg = {
				401:'无可用key',
				402:'超过月限额',
				413:'图片太大',
				415:'格式不支持',
				500:'服务器错误'
			}
			tabMsg = msg[status]
			++this.fail
			this.key = null
		}
		let afterSize = fs.statSync(image).size
		this.afterSize = this.afterSize + afterSize;
		this.notify(this.fileName,beforeSize,afterSize,tabMsg);
		spinner.stop(true);
		return msg
	}
	//获取图片的md5值
	getMd5(image) {
		const fileData = fs.readFileSync(image);
		const hash = crypto.createHash('md5');
		const md5 = hash.update(fileData).digest('hex');
		return md5;
	}
	//获取文件大小
	formatBytes(bytes) {
		if(bytes < 1024) return bytes + " By";
		else if(bytes < 1048576) return(bytes / 1024).toFixed(2) + " KB";
		else if(bytes < 1073741824) return(bytes / 1048576).toFixed(2) + " MB";
		else return(bytes / 1073741824).toFixed(2) + " GB";
	};
	//设置key
	setKey(key) {
		if (!key) {
			return 'key不能为空'.red;
		}
		return setKey(key)
	}
	//查看key的使用情况
	ls() {
		return lsKey()
	}
	clear(key) {
		if (!key) {
			return 'key不能为空'.red;
		}
		return clearKey(key)
	}
	//通知
	notify(image,beforeSize,afterSize,tabMsg) {
		if(afterSize == '--'){
			table.push(
				[image, this.formatBytes(beforeSize), this.formatBytes(beforeSize).yellow,"0".yellow,tabMsg.yellow],
			);
			return
		}
		//去处单位，计算比例，afterSize和beforeSize去掉kb，mb等单位
		let ratio= (((beforeSize - afterSize)/ beforeSize) || 0) .toFixed(2);
// 初始化表格内容
		if(tabMsg == '成功'){
			table.push(
				[image, this.formatBytes(beforeSize), String(this.formatBytes(afterSize)).green, String(ratio).green,String(tabMsg).green],
			);
		}else{
			table.push(
				[image, this.formatBytes(beforeSize), String(this.formatBytes(afterSize)).red, String(ratio).red,String(tabMsg).red],
			);
		}

	}
	async file(file) {
		if (!(file + '')) {
			return '请输入文件名';
		}
		let files = fs.readdirSync(currentPath);
		//过滤出图片文件
		let images = files.filter(item => {
			let imageArr = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'gif', 'GIF', 'webp', 'WEBP'];
			//找到包含imageArr中的元素
			if(item == file || item.split('.')[0] == file){
				if(imageArr.includes(item.split('.')[1])) return item
			}
		});
		//压缩图片,覆盖原图片
		let image = images[0]
		//拷贝当前文件file，然后重命名为name值，然后压缩name
		let readPath = path.join(currentPath, image);
		let fileName = image.split('.')[0] + '.' + image.split('.')[1]
		let writePath = path.join(currentPath, fileName);
		fs.copyFileSync(readPath, writePath);
		this.fileName = fileName
		this.compress(fileName)
		console.log(`
`)
		console.log(table.toString());
		return
	}
	//压缩图片a，命名为图片b
	async fileTo(file,name) {
		if (!(file + '')) {
			return '请输入文件名';
		}
		let files = fs.readdirSync(currentPath);
		//过滤出图片文件
		let images = files.filter(item => {
			let imageArr = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'gif', 'GIF', 'webp', 'WEBP'];
			//找到包含imageArr中的元素
			if(item == file || item.split('.')[0] == file){
				if(imageArr.includes(item.split('.')[1])) return item
			}
		});
		//压缩图片,覆盖原图片
		let image = images[0]
		//拷贝当前文件file，然后重命名为name值，然后压缩name
		let readPath = path.join(currentPath, image);
		let fileName = name.split('.')[0] + '.' + image.split('.')[1]
		let writePath = path.join(currentPath, fileName);
		fs.copyFileSync(readPath, writePath);
		this.fileName = fileName
		this.compress(fileName)
		console.log(`
`)
		console.log(table.toString());
		return
	}
	//压缩目录下的所有图片
	async dir(dir = './') {
		let dirPath = path.join(currentPath,dir);
		let files = fs.readdirSync(dirPath);
		//过滤出图片文件
		let images = files.filter(item => {
			let imageArr = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'gif', 'GIF', 'webp', 'WEBP'];
			if(imageArr.includes(item.split('.')[1])) return item
		});
		//压缩图片,覆盖原图片
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			const filePath = path.join(dirPath, image);
			this.fileName = image
			await this.compress(filePath)
		}
		this.success = this.success + ''
		this.fail = this.fail + ''
		this.skip = this.skip + ''
		table.push(
			['总计大小'.yellow,  '节省空间'.yellow, '成功'.green, '失败'.red, '跳过'.yellow],
		);
		table.push(
			[this.formatBytes(this.beforeSize).yellow, this.formatBytes(this.beforeSize-this.afterSize).yellow,  this.success.green, this.fail.red, this.skip.yellow],
		);
		console.log(`
`)
		console.log(table.toString());
		if(this.key == null){
			return console.log(`请通过此网站获取key：https://tinypng.com/developers 并使用${'tiny'.green} ${'-k'.green} ${'[key]'.yellow}来设置key`)
		}
		return
	}
	async dirTo(dir,name) {
		let dirPath = path.join(dir);
		let files = fs.readdirSync(dirPath);
		//过滤出图片文件
		let images = files.filter(item => {
			let imageArr = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG', 'gif', 'GIF', 'webp', 'WEBP'];
			if(imageArr.includes(item.split('.')[1])) return item
		});
		//压缩图片,覆盖原图片
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			const filePath = path.join(__dirname,dirPath, image);
			let newPath = path.join(__dirname, name);
			if (!fs.existsSync(newPath)) {
				// 如果不存在，则创建文件夹
				fs.mkdirSync(newPath);
			}
			let writePath = path.join(__dirname, name,image);
			fs.copyFileSync(filePath, writePath);
			this.fileName = image
			await this.compress(writePath)
		}
		this.success = this.success + ''
		this.fail = this.fail + ''
		this.skip = this.skip + ''
		table.push(
			['总计大小'.yellow,  '节省空间'.yellow, '成功'.green, '失败'.red, '跳过'.yellow],
		);
		table.push(
			[this.formatBytes(this.beforeSize).yellow, this.formatBytes(this.beforeSize-this.afterSize).yellow,  this.success.green, this.fail.red, this.skip.yellow],
		);
		console.log(`
`)
		console.log(table.toString());
		if(this.key == null){
			return console.log(`请通过此网站获取key：https://tinypng.com/developers 并使用${'tiny'.green} ${'-k'.green} ${'[key]'.yellow}来设置key`)
		}
		return
	}
}
module.exports = Tiny;
