#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const customVersion = '1.0.7';
const tiny = require(path.join(__dirname, '..', 'tiny.js'));
const Tiny = new tiny();
const colors = require('colors');
const Spinner = require("cli-spinner").Spinner;
const keyFIle = require(path.join(__dirname, '..', 'key.js'));
const { restartKey } = keyFIle; //获取可用的key，更新key文件
program
	.usage('图片压缩工具'.green)
	.option('tiny', 'CN:默认压缩当前文件夹的所有图片！EN:Compress all image files in the current folder by default'.green)
	.option('-f,  --file [file]', 'CN:压缩单个图片文件！EN:Compress a single image file'.green)
	.option('-f,  [file] to [file]', 'CN:压缩文件A命名为B！EN:Compress file A named B'.green)
	.option('-d,  --dir [dir]', 'CN:压缩指定目录下的所有图片文件！EN:Compress all image files in the specified directory'.green)
	.option('-d,  [dir] to [dir]', 'CN:压缩文件夹A到文件夹B！EN:Compress folder A named B'.green)
	.option('-v, --version', 'CN:查看版本信息！EN:View version information'.green)
	.option('-k,  --key [key]', 'CN:设置tinify key！EN:Set tinify key'.green)
	.option('-l, --ls', 'CN:查看当前key的使用情况！EN:View the usage of the current key'.green)
	.option('-c, --clear [key]', 'CN:删除某个key！EN:Delete a key'.green)
	.option('-h,  --help', 'CN:查看帮助信息！EN:View help information'.green)
	.on('option:version', () => {
		console.log(`Version: ${customVersion}`); // 输出版本信息
		process.exit(0); // 退出进程
	})
	.on('option:help', () => {
		program.outputHelp(); // 输出帮助信息
		process.exit(0);
	})
	.on('option:key', key => {
		try {
			console.log(Tiny.setKey(key));
		} catch (e) {
			console.log('设置失败,请使用管理员权限设置'.red, e);
		}
		process.exit(0); // 退出进程
	})
	.on('option:clear', key => {
		try {
			console.log(Tiny.clear(key));
		} catch (e) {
			console.log('删除失败,请使用管理员权限查看'.red, e);
		}
		process.exit(0); // 退出进程
	})
	.on('option:*', () => {
		console.error(`CN:错误，找不到该命令，请输入 tiny -h 或者 tiny help 获取帮助信息
    EN:Error, the command cannot be found, please enter tiny -h or tiny help to get help information`);
		process.exit(1);
	})
	.action(async () => {
		let spinner = new Spinner(`正在初始化...%s`);
		spinner.start();
		await restartKey();
		spinner.stop(true);
		let [command, arg1, arg2, arg3] = process.argv.slice(2);
		if (!command) {
			try {
				await Tiny.dir();
			} catch (e) {
				console.log('压缩失败'.red, e);
			}
			process.exit(0);
		}
		switch (command) {
			case '-f':
			case '--file':
				if (arg1 && !arg2 && !arg3) {
					try {
						await Tiny.file(arg1);
					} catch (e) {
						console.log('文件查找失败，请检查文件是否存在'.red, e);
					}
					process.exit(0);
				} else if (arg1 && arg2 && arg3 && arg2.toLowerCase() === 'to') {
					try {
						await Tiny.fileTo(arg1, arg3);
					} catch (e) {
						console.log('文件查找失败，请检查文件是否存在'.red, e);
					}
					process.exit(0);
				} else {
					program.outputHelp();
					process.exit(1);
				}
			case '--dir':
			case '-d':
				if (arg1 && !arg2 && !arg3) {
					try {
						await Tiny.dir(arg1);
					} catch (e) {
						console.log('文件夹查找失败，请检查文件夹是否存在'.red, e);
					}
					process.exit(0);
				} else if (arg1 && arg2 && arg3 && arg2.toLowerCase() === 'to') {
					// 实现你的压缩文件A命名为B的逻辑
					try {
						await Tiny.dirTo(arg1, arg3);
					} catch (e) {
						console.log('文件夹查找失败，请检查文件夹是否存在'.red, e);
					}

					process.exit(0);
				} else {
					program.outputHelp();
					process.exit(1);
				}
			case '-l':
			case '--ls':
				try {
					console.log(Tiny.ls());
				} catch (e) {
					console.log('查看失败,请使用管理员权限查看'.red, e);
				}
				process.exit(0);
			default:
				program.outputHelp();
				process.exit(1);
		}
	})
	// 	.error(`CN:错误，找不到该命令，请输入 tiny -h 或者 tiny help 获取帮助信息
	// en:Error, the command cannot be found, please enter tiny -h or tiny help to get help information`.red)
	//获取错误信息
	.parse(process.argv); // 解析命令行参数
