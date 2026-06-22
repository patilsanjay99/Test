(async () => {
    try {
        const res = await fetch("http://localhost:3000/api/data/InventoryItems?CompanyId=1");
        const json = await res.json();
        console.log("Items count:", json?.length);
        if (json && json.length > 0) {
           console.log("First item keys:", Object.keys(json[0]));
           console.log("First 3 items:", json.slice(0, 3).map((r: any) => ({ Name: r.Name, name: r.name, ITEMNAME: r.ItemName })));
        } else {
           console.dir(json);
        }
    } catch(e) {
        console.error(e);
    }
})();
