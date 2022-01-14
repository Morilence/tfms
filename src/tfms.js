(function (window) {
    let CLASSNAME = {
        TREEVIEW: "tfms__treeview",
        WRAPPER: "tfms__treeview__wrapper",
        LIST: "tfms__list",
        ITEM: "tfms__list__item",
        ITEM_NAME: "tfms__item__name",
        FILE: "tfms__list__file",
        DIR_FOLDED: "tfms__list__dir_folded",
        DIR_UNFOLDED: "tfms__list__dir_unfolded",
        CTXMENU_PREFIX: "tfms__treeview__ctxmenu",
        CTXMENU_HIDE: "tfms__treeview__ctxmenu_hide",
        CTXMENU_ACTIVE: "tfms__treeview__ctxmenu_active",
        CTXMENU_ITEM: "tfms__ctxmenu__item",
        CTXMENU_ITEM_DISABLED: "tfms__ctxmenu__item_disabled",
    };

    // global config
    let config = {
        indent: 15,
        operName: {
            newfile: "newfile",
            newdir: "newdir",
            cut: "cut",
            copy: "copy",
            paste: "paste",
            rename: "rename",
            remove: "remove",
        },
    };

    // interfaces
    let instance = {
        // api
        build: function (el, cfg = {}, ls = []) {
            this.setup(cfg);
            // attach and render
            comps.Body.attach(utils.getDom(el));
            comps.Body.render();
            comps.TreeView.attach(comps.Body.el.querySelector(`.${CLASSNAME.TREEVIEW}`));
            comps.TreeView.render();
            comps.Wrapper.attach(comps.TreeView.el.querySelector(`.${CLASSNAME.WRAPPER}`));
            comps.Wrapper.render(ls);
            comps.ContextMenu.attach(comps.TreeView.el.querySelector(`[class^="${CLASSNAME.CTXMENU_PREFIX}"]`));
            comps.ContextMenu.render();
            // install listeners
            document.addEventListener("click", handlers.GlobalClick);
            comps.Wrapper.el.addEventListener("click", handlers.WrapperClick);
            comps.Wrapper.el.addEventListener("contextmenu", handlers.WrapperContextmenu);
            comps.ContextMenu.el.addEventListener("click", handlers.ContextMenuClick);
        },
        setup: function (cfg) {
            Object.assign(config, cfg);
        },
        reload: function (ls = []) {
            comps.ContextMenu.hide();
            comps.Wrapper.render(ls);
        },
        parse: function () {
            return fn.ListParser(fn.getListOf(comps.Wrapper.el));
        },
        destroy: function () {
            // uninstall listeners
            document.removeEventListener("click", handlers.GlobalClick);
            comps.Wrapper.el.removeEventListener("click", handlers.WrapperClick);
            comps.Wrapper.el.removeEventListener("contextmenu", handlers.WrapperContextmenu);
            comps.ContextMenu.el.removeEventListener("click", handlers.ContextMenuClick);
            comps.Body.el.innerHTML = "";
        },
        // event correlation
        listeners: {},
        on: function (type, callback) {
            if (!(type in this.listeners)) {
                this.listeners[type] = [];
            }
            this.listeners[type].push(callback);
        },
        off: function (type, callback) {
            if (!(type in this.listeners)) {
                return;
            }
            let stack = this.listeners[type];
            for (let i = 0; i < stack.length; i++) {
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                    return this.off(type, callback);
                }
            }
        },
        emit: function (evt) {
            if (!(evt.type in this.listeners)) {
                return;
            }
            let stack = this.listeners[evt.type];
            for (let i = 0; i < stack.length; i++) {
                stack[i].call(this, evt);
            }
        },
    };

    // components
    let comps = {
        Body: {
            el: null,
            attach: function (el) {
                this.el = el;
            },
            render: function () {
                this.el.innerHTML = `<div class="${CLASSNAME.TREEVIEW}"></div>`;
            },
        },
        TreeView: {
            el: null,
            attach: function (el) {
                this.el = el;
            },
            render: function () {
                this.el.innerHTML = `
                    <div class="${CLASSNAME.WRAPPER}"></div>
                    <ul class="${CLASSNAME.CTXMENU_HIDE}"></ul>
                `;
            },
        },
        Wrapper: {
            el: null,
            attach: function (el) {
                this.el = el;
            },
            render: function (dataList) {
                this.el.innerHTML = fn.ListGenerator(dataList, 1);
            },
        },
        ContextMenu: {
            el: null,
            attach: function (el) {
                this.el = el;
            },
            render: function (code) {
                const opers = {
                    newfile: { displayName: config.operName.newfile },
                    newdir: { displayName: config.operName.newdir },
                    cut: { displayName: config.operName.cut },
                    copy: { displayName: config.operName.copy },
                    paste: { displayName: config.operName.paste },
                    rename: { displayName: config.operName.rename },
                    remove: { displayName: config.operName.remove },
                };
                let menu = null;
                switch (code) {
                    case -1:
                        menu = ["newfile", "newdir", "paste"];
                        break;
                    case 0:
                        menu = ["newfile", "newdir", "cut", "copy", "paste", "rename", "remove"];
                        break;
                    case 1:
                        menu = ["cut", "copy", "rename", "remove"];
                        break;
                    default:
                        menu = [];
                        break;
                }
                this.el.innerHTML = menu
                    .map(menuItem => {
                        return `<li class="${
                            menuItem == "paste" && state.CacheItem == null
                                ? CLASSNAME.CTXMENU_ITEM_DISABLED
                                : CLASSNAME.CTXMENU_ITEM
                        }" data-oper="${menuItem}">${opers[menuItem].displayName}</li>`;
                    })
                    .join("");
            },
            show: function () {
                this.el.className = CLASSNAME.CTXMENU_ACTIVE;
            },
            hide: function () {
                this.el.className = CLASSNAME.CTXMENU_HIDE;
            },
        },
    };

    // global state
    let state = {
        // 当前活动项
        ActionItem: null,
        // 缓存项
        CacheItem: null,
        setAsActionItem: function (Item) {
            this.ActionItem = Item;
        },
        setAsCacheItem: function (Item) {
            this.CacheItem = Item;
        },
    };

    // inner functions
    let fn = {
        isRoot: function (el) {
            return el == comps.Wrapper.el;
        },
        isItem: function (el) {
            return el.classList != undefined && el.classList.contains(CLASSNAME.ITEM);
        },
        isFile: function (Item) {
            return Item.classList.contains(CLASSNAME.FILE);
        },
        isDir: function (Item) {
            return (
                Item != null &&
                (Item.classList.contains(CLASSNAME.DIR_FOLDED) || Item.classList.contains(CLASSNAME.DIR_UNFOLDED))
            );
        },
        isDirFolded: function (Dir) {
            return Dir.classList.contains(CLASSNAME.DIR_FOLDED);
        },
        isSameNameExistIn: function (List, name) {
            for (let i = 0; i < List.children.length; i++) {
                if (List.children[i].dataset.name == name) {
                    return true;
                }
            }
            return false;
        },
        getNameOf: function (Item) {
            return Item.dataset.name;
        },
        setNameAs: function (Item, name) {
            Item.dataset.name = name;
        },
        getLayerOf: function (Item) {
            return parseInt(Item.dataset.layer);
        },
        getParentDirOf: function (Item) {
            if (Item.parentNode != null) {
                return Item.parentNode.parentNode;
            } else {
                return null;
            }
        },
        getPathOf: function (Item) {
            let pathArray = [];
            while (this.isDir(this.getParentDirOf(Item)) || this.isRoot(this.getParentDirOf(Item))) {
                pathArray.unshift(this.getNameOf(Item));
                Item = this.getParentDirOf(Item);
            }
            return pathArray.join("\\");
        },
        getListOf: function (Dir) {
            // the case: isRoot(dir)==true is already included.
            return Dir.querySelector(`.${CLASSNAME.LIST}`);
        },
        getItemByNameIn: function (List, name) {
            for (let i = 0; i < List.children.length; i++) {
                if (List.children[i].dataset.name == name) {
                    return List.children[i];
                }
            }
            return null;
        },
        setListAs: function (Dir, List) {
            // the case: isRoot(dir)==true is already included.
            if (Dir.querySelector(`.${CLASSNAME.LIST}`)) {
                Dir.removeChild(Dir.querySelector(`.${CLASSNAME.LIST}`));
            }
            Dir.innerHTML += List;
        },
        fold: function (Dir) {
            if (this.isRoot(Dir)) return;
            if (!this.isDirFolded(Dir)) {
                Dir.classList.replace(CLASSNAME.DIR_UNFOLDED, CLASSNAME.DIR_FOLDED);
            }
        },
        unfold: function (Dir) {
            if (this.isRoot(Dir)) return;
            if (this.isDirFolded(Dir)) {
                Dir.classList.replace(CLASSNAME.DIR_FOLDED, CLASSNAME.DIR_UNFOLDED);
            }
        },
        // generate tmpl(List) according to data list.
        ListGenerator: function (dataList, layer) {
            let dirList = [];
            let fileList = [];
            dataList.forEach(dataItem => {
                if (dataItem.isdir) {
                    dirList.push(dataItem);
                } else {
                    fileList.push(dataItem);
                }
            });
            dirList.sort((a, b) => {
                return a.name < b.name ? -1 : 0;
            });
            fileList.sort((a, b) => {
                return a.name < b.name ? -1 : 0;
            });
            return `
                <ul class="${CLASSNAME.LIST}">
                    ${dirList
                        .concat(fileList)
                        .map(dataItem => {
                            return this.ItemGenerator(dataItem, layer);
                        })
                        .join("")}
                </ul>
            `;
        },
        // generate tmpl(Item) according to data obj.
        ItemGenerator: function (dataItem, layer) {
            let { name, isdir, isfolded, children } = dataItem;
            isfolded = isfolded == undefined ? true : isfolded;
            return `
                <li
                    class="${
                        CLASSNAME.ITEM +
                        " " +
                        (isdir ? (isfolded ? CLASSNAME.DIR_FOLDED : CLASSNAME.DIR_UNFOLDED) : CLASSNAME.FILE)
                    }"
                    data-name="${name}"
                    data-layer="${layer}"
                >
                    <div 
                        class="${CLASSNAME.ITEM_NAME}"
                        style="padding-left :${layer * config.indent}px;">
                        ${name}
                    </div>
                    ${isdir ? this.ListGenerator(children, layer + 1) : ""}
                </li>
            `;
        },
        // parse List to data list.
        ListParser: function (List) {
            let dataList = [];
            for (let i = 0; i < List.children.length; i++) {
                dataList.push(this.ItemParser(List.children[i]));
            }
            return dataList;
        },
        // parse Item to data obj.
        ItemParser: function (Item) {
            let dataItem = {};
            dataItem.name = this.getNameOf(Item);
            dataItem.path = this.getPathOf(Item);
            dataItem.isdir = this.isDir(Item);
            if (dataItem.isdir) {
                dataItem.isfolded = this.isDirFolded(Item);
                dataItem.children = this.ListParser(this.getListOf(Item));
            }
            return dataItem;
        },
    };

    // file operations
    let ops = {
        new: function (isdir) {
            fn.unfold(state.ActionItem);
            let subDataList = fn.ListParser(fn.getListOf(state.ActionItem));
            let insertIndex = null;
            subDataList.forEach((dataItem, index) => {
                if (!insertIndex && dataItem.isdir == isdir) {
                    insertIndex = isdir ? 0 : index;
                }
            });
            // when subDataList is empty or there is no file type Item.
            if (insertIndex == null) {
                insertIndex = isdir ? 0 : subDataList.length;
            }
            let newDataItem = {};
            newDataItem.name = "";
            newDataItem.isdir = isdir;
            if (isdir) {
                newDataItem.isfolded = true;
                newDataItem.children = [];
            }
            let layer = fn.isRoot(state.ActionItem) ? 1 : fn.getLayerOf(state.ActionItem) + 1;
            if (!isdir && insertIndex == subDataList.length) {
                fn.getListOf(state.ActionItem).innerHTML += fn.ItemGenerator(newDataItem, layer);
            } else {
                fn.getListOf(state.ActionItem).insertBefore(
                    utils.tmpl2Dom(fn.ItemGenerator(newDataItem, layer), "li"),
                    fn.getListOf(state.ActionItem).children[insertIndex]
                );
            }
            // change ActionItem to the new Item.
            state.setAsActionItem(fn.getListOf(state.ActionItem).children[insertIndex]);
            this.inputname((val, NameContainer) => {
                if (val != "") {
                    if (fn.isSameNameExistIn(fn.getListOf(fn.getParentDirOf(state.ActionItem)), val)) {
                        instance.emit({ type: "nameconflict", name: val });
                        // remove if there is the same name Item.
                        fn.getListOf(fn.getParentDirOf(state.ActionItem)).removeChild(state.ActionItem);
                    } else {
                        fn.setNameAs(state.ActionItem, val);
                        NameContainer.innerText = val;

                        instance.emit({
                            type: "new",
                            target: fn.ItemParser(state.ActionItem),
                        });
                        // rerender the List.
                        let layer = fn.isRoot(fn.getParentDirOf(state.ActionItem))
                            ? 1
                            : fn.getLayerOf(state.ActionItem);
                        fn.setListAs(
                            fn.getParentDirOf(state.ActionItem),
                            fn.ListGenerator(fn.ListParser(fn.getListOf(fn.getParentDirOf(state.ActionItem))), layer)
                        );
                    }
                } else {
                    // remove if not named.
                    fn.getListOf(fn.getParentDirOf(state.ActionItem)).removeChild(state.ActionItem);
                }
            });
        },
        copy: function () {
            instance.emit({
                type: "copy",
                target: fn.ItemParser(state.ActionItem),
            });
            state.setAsCacheItem(state.ActionItem);
        },
        cut: function () {
            instance.emit({
                type: "cut",
                target: fn.ItemParser(state.ActionItem),
            });
            state.setAsCacheItem(state.ActionItem);
            fn.getListOf(fn.getParentDirOf(state.ActionItem)).removeChild(state.ActionItem);
        },
        paste: function () {
            if (state.CacheItem != null) {
                if (fn.isSameNameExistIn(fn.getListOf(state.ActionItem), fn.getNameOf(state.CacheItem))) {
                    instance.emit({ type: "nameconflict", name: fn.getNameOf(state.CacheItem) });
                } else {
                    let subDataList = fn.ListParser(fn.getListOf(state.ActionItem));
                    subDataList.push(fn.ItemParser(state.CacheItem));
                    let layer = fn.isRoot(state.ActionItem) ? 1 : fn.getLayerOf(state.ActionItem) + 1;
                    fn.setListAs(state.ActionItem, fn.ListGenerator(subDataList, layer));
                    instance.emit({
                        type: "paste",
                        target: fn.ItemParser(
                            fn.getItemByNameIn(fn.getListOf(state.ActionItem), fn.getNameOf(state.CacheItem))
                        ),
                    });
                    fn.unfold(state.ActionItem);
                }
            }
        },
        remove: function () {
            instance.emit({
                type: "remove",
                target: fn.ItemParser(state.ActionItem),
            });
            fn.getListOf(fn.getParentDirOf(state.ActionItem)).removeChild(state.ActionItem);
        },
        rename: function () {
            this.inputname((val, NameContainer) => {
                if (val != "") {
                    if (val == fn.getNameOf(state.ActionItem)) {
                        NameContainer.innerText = fn.getNameOf(state.ActionItem);
                    } else {
                        if (fn.isSameNameExistIn(fn.getListOf(fn.getParentDirOf(state.ActionItem)), val)) {
                            instance.emit({ type: "nameconflict", name: val });
                            NameContainer.innerText = fn.getNameOf(state.ActionItem);
                        } else {
                            fn.setNameAs(state.ActionItem, val);
                            NameContainer.innerText = val;
                            instance.emit({
                                type: "rename",
                                target: fn.ItemParser(state.ActionItem),
                            });
                        }
                    }
                } else {
                    NameContainer.innerText = fn.getNameOf(state.ActionItem);
                }
                // rerender
                let layer = fn.isRoot(fn.getParentDirOf(state.ActionItem)) ? 1 : fn.getLayerOf(state.ActionItem);
                fn.setListAs(
                    fn.getParentDirOf(state.ActionItem),
                    fn.ListGenerator(fn.ListParser(fn.getListOf(fn.getParentDirOf(state.ActionItem))), layer)
                );
            });
        },
        inputname: function (callback) {
            const NameContainer = state.ActionItem.querySelector(`.${CLASSNAME.ITEM_NAME}`);
            NameContainer.innerHTML = `<input type="text"></input>`;
            const NameInput = NameContainer.querySelector("input[type='text']");
            NameInput.focus();
            NameInput.value = fn.getNameOf(state.ActionItem);
            NameInput.addEventListener("blur", NameInputBlurHandler);
            NameInput.addEventListener("keydown", NameInputKeydownHandler);

            function NameInputBlurHandler(evt) {
                confirmInput(evt.target.value.trim());
            }
            function NameInputKeydownHandler(evt) {
                if (evt.keyCode == 13) {
                    confirmInput(evt.target.value.trim());
                }
            }
            function confirmInput(val) {
                NameInput.removeEventListener("blur", NameInputBlurHandler);
                NameInput.removeEventListener("keydown", NameInputKeydownHandler);
                callback(val, NameContainer);
            }
        },
    };

    // handlers
    let handlers = {
        GlobalClick: function () {
            comps.ContextMenu.hide();
        },
        WrapperClick: function (evt) {
            evt.preventDefault();
            if (evt.target.className == CLASSNAME.ITEM_NAME) {
                instance.emit({
                    type: "itemclick",
                    target: fn.ItemParser(evt.target.parentNode),
                });
                if (fn.isDirFolded(evt.target.parentNode)) {
                    fn.unfold(evt.target.parentNode);
                } else {
                    fn.fold(evt.target.parentNode);
                }
            }
        },
        WrapperContextmenu: function (evt) {
            evt.preventDefault();
            comps.ContextMenu.show();
            comps.ContextMenu.el.style.left = evt.pageX - utils.getPageXOf(comps.Wrapper.el) + "px";
            comps.ContextMenu.el.style.top = evt.pageY - utils.getPageYOf(comps.Wrapper.el) + "px";
            if (evt.target.className == CLASSNAME.ITEM_NAME) {
                state.setAsActionItem(evt.target.parentNode);
                if (fn.isFile(state.ActionItem)) {
                    comps.ContextMenu.render(1);
                } else {
                    comps.ContextMenu.render(0);
                }
            } else if (fn.isRoot(evt.target)) {
                state.setAsActionItem(evt.target);
                comps.ContextMenu.render(-1);
            }
        },
        ContextMenuClick: function (evt) {
            evt.preventDefault();
            if (evt.target.className == CLASSNAME.CTXMENU_ITEM) {
                switch (evt.target.dataset.oper) {
                    case "newfile":
                        ops.new(false);
                        break;
                    case "newdir":
                        ops.new(true);
                        break;
                    case "cut":
                        ops.cut();
                        break;
                    case "copy":
                        ops.copy();
                        break;
                    case "paste":
                        ops.paste();
                        break;
                    case "rename":
                        ops.rename();
                        break;
                    case "remove":
                        ops.remove();
                        break;
                    default:
                        break;
                }
            }
        },
    };

    // utils
    let utils = {
        isString: function (o) {
            return Object.prototype.toString.call(o) == "[object String]";
        },
        isArray: function (o) {
            return Object.prototype.toString.call(o) == "[object Array]";
        },
        isDom: function (o) {
            return typeof HTMLElement === "object"
                ? o instanceof HTMLElement
                : o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string";
        },
        getDom: function (o) {
            if (this.isDom(o)) {
                return o;
            } else if (this.isString(o)) {
                return document.querySelector(o);
            }
            return null;
        },
        getPageXOf: function (el) {
            let res = 0;
            let currEl = el;
            while (currEl != null) {
                res += currEl.offsetLeft;
                currEl = currEl.offsetParent;
            }
            return res;
        },
        getPageYOf: function (el) {
            let res = 0;
            let currEl = el;
            while (currEl != null) {
                res += currEl.offsetTop;
                currEl = currEl.offsetParent;
            }
            return res;
        },
        tmpl2Dom(tmpl, tagname) {
            return new DOMParser().parseFromString(tmpl, "text/html").querySelector(tagname);
        },
    };

    window.tfms = instance;
})(window);
