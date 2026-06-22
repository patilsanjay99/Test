(async () => {
    try {
        const payload = {
            Name: "Wheat",
            Category: "Seeds",
            Quantity: 10,
            CompanyId: 1
        };
        const res = await fetch("http://localhost:3000/api/data/InventoryItems", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        console.log("POST:", await res.json());

        const res2 = await fetch("http://localhost:3000/api/data/InventoryItems");
        const json = await res2.json();
        console.log("GET:", json);
    } catch(e) {
        console.error(e);
    }
})();
