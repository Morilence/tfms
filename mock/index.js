function mock() {
    return [
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
                {
                    name: "videos",
                    isdir: true,
                    children: [],
                },
                {
                    name: "fonts",
                    isdir: true,
                    children: [],
                },
            ],
        },
        {
            name: "libs",
            isdir: true,
            children: [
                {
                    name: "jquery",
                    isdir: true,
                    children: [
                        {
                            name: "jquery-3.4.1.min.js",
                            isdir: false,
                        },
                    ],
                },
                { name: "normalize.css", isdir: false },
            ],
        },
        {
            name: "index.html",
            isdir: false,
        },
        {
            name: "index.css",
            isdir: false,
        },
        {
            name: "index.js",
            isdir: false,
        },
    ];
}
