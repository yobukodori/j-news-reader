const jnr = {
	appVer: "1.0.2",
	updateInterval: 5 * 60 * 1000,
};

function notify(n){
	let r = /^(🆕\s)?(.+)/.exec(document.title);
	r && (document.title = (n.new ? "🆕 " : "") + r[2]);
}

function sortedIndex(array, value, descending) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (descending ? array[mid] > value :  value > array[mid]) low = mid + 1;
        else high = mid;
    }
    return low;
}

function showStatus(){
	let text = "";
	Array.from(arguments).forEach(e => text += " " + e);
	document.getElementById("status").textContent = text.substring(1);
}

function showStatistics(){
	let container = document.getElementById('items'), displaying = 0, news = 0;
	Array.from(container.children).forEach(e => {
		e.offsetParent && ++displaying;
		e.classList.contains("new") && ++news;
	});
	showStatus("記事総数:" + container.children.length, "新着:" + news, "表示中:" + displaying);
}

function showUpdateTime(datetime){
	document.getElementById("update-time").textContent = new Date(datetime).toLocaleTimeString();
}

function printRSS(rss, opts){
	opts = opts || {};
	const chtitle = document.getElementById("channel-select").value, container = document.getElementById('items'), today = new Date();
	rss.item.forEach(d => {
		console.log(d);
		let duplicated;
		if (duplicated = Array.from(container.children).find(item => item.dataItem.link === d.link)){
			console.log("duplicated link");
			if (! d.exact || ! duplicated.dataItem.exact){ return; }
			let datetime = duplicated.dataItem.datetime2 || duplicated.dataItem.datetime;
			if (d.datetime <= datetime){ return; }
			duplicated.remove();
		}
		const title = document.createElement("a"),
				description = document.createElement("span"),
				channel = document.createElement("a"),
				date = document.createElement("span"),
				item = document.createElement("div");
		title.textContent = (d.title || "(無題)"), title.className = "title";
		d.link && (title.href = d.link), title.target = "_blank";
		item.appendChild(title), item.className = "item";
		description.textContent = d.description || "", description.className = "description";
		channel.append(rss.channel.title), channel.href = rss.channel.link, channel.className = "channel", channel.target = "_blank";
		date.textContent = d.datetime ? (new Date(d.datetime)).toLocaleString() : (d.date  || ""), date.className = "date";
		item.className = "item", item.append(title, description, channel, date);
		item.dataItem = d, item.dataChannel = rss.channel;
		let datetime = item.dataItem.datetime;
		if (datetime === 0){
			let r = /^((\d+)年)?(\d+)月(\d+)日$/.exec(item.dataItem.date);
			r && (item.dataItem.datetime2 = datetime = Date.parse( (r[2] || today.getFullYear()) + "/" + r[3] + "/" +r [4] + " 00:00"));
		}
		opts.markNew && item.classList.add("new");
		! (! chtitle || (chtitle === "!new" && item.classList.contains("new")) || item.dataChannel.title === chtitle) && item.classList.add("x-channel");
		let ar = Array.from(container.children).map(item => item.dataItem.datetime2 || item.dataItem.datetime),  i = sortedIndex(ar, datetime, true);
		while (i < ar.length && datetime === ar[i]){ i++; }
		i < container.children.length ? container.children[i].before(item) : container.append(item);
	});
}

function update(){
	if (jnr.updating){
		alert("update() called when updating");
		return;
	}
	jnr.updating = true;
	const container = document.getElementById('items');
	//Array.from(container.children).forEach(item => item.classList.remove("new"));
	showUpdateTime(jnr.lastUpdateStart = Date.now());
	showStatus("読み込み中・・・");
	let total = Object.keys(profiles).length,  read = 0;
	jnr.tasks = [];
	Object.keys(profiles).forEach(k => {
		const prof = profiles[k];
		//if (! prof.name.startsWith("jiji.comトップ")){return;}
		console.log("channel:", prof);
		let pr = getRSS(prof);
		jnr.tasks.push(pr);
		pr.then(rss => {
			if (rss.error){
				console.log("# An error occurred while loading", prof.url, ":",  rss.error);
				return;
			}
			console.log("# got rss from", prof.url);
			printRSS(rss, {markNew: !!jnr.lastUpdateEnd});
			if (rss.channel.title){
				const container = document.getElementById('channel-select'),
					ar = Array.from(container.children).map(opt => opt.value);
				if (! ar.includes(rss.channel.title)){
					let e = document.createElement("option");
					e.value = e.textContent = rss.channel.title;
					let i = sortedIndex(ar, e.value);
					i < container.children.length ? container.children[i].before(e) : container.append(e);
				}
			}
			showStatus(++read === total ? "取得結果:" : read + "/" + total + " 読み込み中・・・", container.children.length, "件");
		});
	});
	Promise.allSettled(jnr.tasks).then(values => {
		showStatistics();
		notify({"new": container.querySelectorAll('.item.new').length});
		jnr.lastUpdateEnd = Date.now();
		jnr.updating = false;
		document.getElementById("auto-update").checked && setUpdateTimer();
	});
}

document.getElementById("channel-select").addEventListener("change", ()=>{
	let chtitle = document.getElementById("channel-select").value;
	console.log("channel-select on change. value:", chtitle);
	Array.from(document.getElementById('items').children).forEach(e => {
		(! chtitle || (chtitle === "!new" && e.classList.contains("new")) || e.dataChannel.title === chtitle) ? e.classList.remove("x-channel") : e.classList.add("x-channel");
	});
	showStatistics();
});

document.getElementById("update").addEventListener("click", ()=>{
	clearUpdateTimer();
	update();
});

function onUpdateTimer(ev){
	--jnr.updateCounter;
	document.getElementById("update-counter").textContent = jnr.updateCounter;
	if (jnr.updateCounter === 0){
		clearInterval(jnr.updateTimer);
		jnr.updateTimer = null;
		update();
	}
}

function setUpdateTimer(){
	let au = document.getElementById("auto-update"),
		intr = parseInt(document.getElementById("update-interval").value);
	if (isNaN(intr)){
		alert("自動更新間隔分数が不正です。整数を指定してください");
		au.checked = false;
		return;
	}
	document.getElementById("update-counter").textContent = jnr.updateCounter = intr * 60;
	jnr.updateTimer = setInterval(onUpdateTimer, 1000);
}

function clearUpdateTimer(){
	jnr.updateTimer && (clearInterval(jnr.updateTimer), jnr.updateTimer = null, document.getElementById("update-counter").textContent = "∞");
}

document.getElementById("auto-update").addEventListener("change", ()=>{
	let e = document.getElementById("auto-update"), checked = e.checked, aui = document.getElementById("auto-update-info");
	checked ? (! jnr.updating && setUpdateTimer(), aui.classList.remove("hide")) : (clearUpdateTimer(), aui.classList.add("hide"));
});

document.getElementById("clear-new-mark").addEventListener("click", ()=>{
	document.querySelectorAll('.item.new').forEach(e => e.classList.remove("new"));
	const cs = document.getElementById("channel-select"), title = cs.value;
	title === "!new" && cs.dispatchEvent(new Event("change"));
	notify({"new": 0});
	showStatistics();
});

document.getElementById("clear-new-mark-then-upate").addEventListener("click", ()=>{
	document.getElementById("clear-new-mark").dispatchEvent(new MouseEvent("click"));
	document.getElementById("update").dispatchEvent(new MouseEvent("click"));
});

document.getElementById("filter-text").addEventListener("keydown", (ev)=>{
	ev.key === "Enter" ? document.getElementById("apply-filter").click() : ev.key === "Escape" ? document.getElementById("clear-filter").click() : 0;
});

document.getElementById("apply-filter").addEventListener("click", ()=>{
	let ft = document.getElementById("filter-text");
	let text = ft.value.trim();
	if (! text){
		alert("フィルタを指定してください");
		return;
	}
	console.log("filter-text:", text);
	const filter = new Filter(text);
	if (filter.error){
		alert(filter.error);
		return;
	}
	Array.from(document.getElementById('items').children).forEach(e => {
		filter.match(e.dataItem.title) ? e.classList.remove("x-filter") : e.classList.add("x-filter");
	});
	showStatistics();
});

document.getElementById("clear-filter").addEventListener("click", ()=>{
	Array.from(document.getElementById('items').children).forEach(e => e.classList.remove("x-filter"));
	showStatistics();
});

document.addEventListener("DOMContentLoaded", ()=>{
	let urls = "", channels = "";
	Object.keys(profiles).forEach(k => {
		urls += ", " + profiles[k].url;
		profiles[k].access && profiles[k].access.forEach(url => urls += ", " + url);
		channels += ", " + profiles[k].name + (profiles[k].type === "rss" ? "(RSS)" : "");
	});
	document.getElementById("cors-urls").textContent = urls.substring(1);
	document.getElementById("collecting-channels").textContent = channels.substring(1);
	document.getElementById("app-ver").textContent = jnr.appVer;
	["auto-update", "channel-select"].forEach(id => document.getElementById(id).dispatchEvent(new Event("change")));
	let opts = {};
	location.search.substring(1).split("&").forEach(param=>{
		let i = param.indexOf("="), 
			name = (i !== -1 ? param.substring(0, i) : param), 
			val = (i !== -1 ? decodeURIComponent(param.substring(i+1)) : null);
		name && (opts[name] = val);
	});
	! opts.hasOwnProperty("m") && update();
});
