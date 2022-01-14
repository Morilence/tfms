# tfms

A native JS implementation of the file tree component.

## Example

```js
tfms.build(
    ".tfms",
    {
        indent: 14,
        operName: {
            newfile: "新建文件",
            newdir: "新建文件夹",
            cut: "剪切",
            copy: "复制",
            paste: "粘贴",
            rename: "重命名",
            remove: "删除",
        },
    },
    // initial data
    [
        {
            name: "assets",
            isdir: true,
            children: [
                {
                    name: "images",
                    isdir: true,
                    children: [
                        { name: "zxy.png", isdir: false },
                        { name: "myx.jpg", isdir: false },
                    ],
                },
            ],
        },
    ]
);

// internal events
tfms.on("itemclick", evt => {
    console.log(evt);
});

tfms.on("new", evt => {
    console.log(evt);
});

tfms.on("cut", evt => {
    console.log(evt);
});

tfms.on("copy", evt => {
    console.log(evt);
});

tfms.on("paste", evt => {
    console.log(evt);
});

tfms.on("remove", evt => {
    console.log(evt);
});

tfms.on("rename", evt => {
    console.log(evt);
});

tfms.on("nameconflict", () => {
    alert("A file/folder with the same name already exists in the current directory！");
});
```

## Preview

[https://morilence.github.io/strech-box/](https://morilence.github.io/strech-box/)
