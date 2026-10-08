// Flip: editable After Effects prototype. Figma text/backgrounds remain native AE layers.
(function () {
    var root = "/Users/watashiwaningen/Desktop/My Portfolio/showreel";
    function key(prop, a, av, b, bv) {
        prop.setValueAtTime(a, av); prop.setValueAtTime(b, bv);
    }
    function textLayer(comp, name, copy, font, size, color, position, start, end) {
        var layer = comp.layers.addText(copy);
        layer.name = name;
        layer.inPoint = start; layer.outPoint = end;
        var doc = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
        doc.text = copy;
        doc.font = font;
        doc.fontSize = size;
        doc.fillColor = color;
        doc.applyFill = true;
        doc.applyStroke = false;
        layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc);
        layer.property("ADBE Transform Group").property("ADBE Position").setValue(position);
        return layer;
    }
    function solid(comp, name, color, start, end) {
        var layer = comp.layers.addSolid(color, name, 3840, 2160, 1, end - start);
        layer.startTime = start; layer.inPoint = start; layer.outPoint = end;
        return layer;
    }
    function imageLayer(comp, filename, name, start, end, position, scale, rotation) {
        var file = new File(root + "/flip_assets/" + filename);
        if (!file.exists) throw new Error("Missing asset: " + filename);
        var item = app.project.importFile(new ImportOptions(file));
        var layer = comp.layers.add(item);
        layer.name = name; layer.inPoint = start; layer.outPoint = end;
        layer.transform.position.setValue(position);
        layer.transform.scale.setValue([scale, scale]);
        layer.transform.rotation.setValue(rotation);
        return layer;
    }
    app.beginUndoGroup("Build layered Flip proof");
    try {
        if (!app.project) app.newProject();
        for (var old = app.project.numItems; old >= 1; old--) {
            var oldItem = app.project.item(old);
            if (oldItem instanceof CompItem && oldItem.name === "FLIP | Layered 4K Proof") oldItem.remove();
        }
        var comp = app.project.items.addComp("FLIP | Layered 4K Proof", 3840, 2160, 1, 13, 24);
        var blue = [0.161, 0.38, 0.937], cream = [1, 0.976, 0.949], white = [1,1,1];

        // Scene 01: source coins stay a transparent media layer; words stay editable text.
        solid(comp, "01 | Electric blue background", blue, 0, 3.2);
        var flip = textLayer(comp, "01 | Flip — editable type", "Flip", "FilsonPro-Medium", 900, white, [70, 2020], 0, 3.2);
        var it = textLayer(comp, "01 | it — editable type", "it", "FilsonPro-Medium", 900, white, [3094, 2020], 0, 3.2);
        key(flip.property("ADBE Transform Group").property("ADBE Position"), 0, [-320,2020], 0.6, [70,2020]);
        key(it.property("ADBE Transform Group").property("ADBE Position"), 0.12, [4110,2020], 0.72, [3094,2020]);
        var coinFile = new File(root + "/flip_assets/coins.png");
        if (!coinFile.exists) throw new Error("Coin asset missing");
        var coinItem = app.project.importFile(new ImportOptions(coinFile));
        var coins = comp.layers.add(coinItem);
        coins.name = "01 | Coin artwork — independent media layer";
        coins.inPoint = 0; coins.outPoint = 3.2;
        var ct = coins.property("ADBE Transform Group");
        ct.property("ADBE Position").setValue([2642, 896]);
        coins.transform.rotation.setValue(-43);
        key(ct.property("ADBE Scale"), 0, [65,65], 0.75, [79,79]);
        ct.property("ADBE Scale").setValueAtTime(3.2, [84,84]);

        // Scene 02: all visible design elements are native AE layers.
        solid(comp, "02 | Electric blue background", blue, 3.2, 5.0);
        var domain = textLayer(comp, "02 | flip.it — editable type", "flip.it", "CabinetGrotesk-Bold", 416, cream, [1490, 1160], 3.2, 5.0);
        key(domain.property("ADBE Transform Group").property("ADBE Scale"), 3.2, [85,85], 3.72, [100,100]);
        key(domain.property("ADBE Transform Group").property("ADBE Opacity"), 3.2, 0, 3.38, 100);

        // Scene 03: campaign copy reconstructed as editable type.
        solid(comp, "03 | Warm cream background", cream, 5.0, 7.5);
        var lines = ["Own it.", "Flip it.", "Go big."];
        for (var i = 0; i < lines.length; i++) {
            var line = textLayer(comp, "03 | " + lines[i] + " — editable type", lines[i], "CabinetGrotesk-Bold", 310, blue, [1450, 850 + i * 320], 5.0, 7.5);
            var p = line.property("ADBE Transform Group").property("ADBE Position");
            key(p, 5.0 + i * 0.17, [1450, 1000 + i * 320], 5.52 + i * 0.17, [1450, 850 + i * 320]);
            key(line.property("ADBE Transform Group").property("ADBE Opacity"), 5.0 + i * 0.17, 0, 5.28 + i * 0.17, 100);
        }

        // Scene 04: independent ribbon instances and editable campaign copy.
        solid(comp, "04 | Electric blue background", blue, 7.5, 10.4);
        var swap = textLayer(comp, "04 | Swap your crypto — editable type", "Swap your crypto", "CabinetGrotesk-Bold", 275, white, [300, 830], 7.5, 10.4);
        var seamlessly = textLayer(comp, "04 | Seamlessly — editable type", "Seamlessly.", "CabinetGrotesk-Bold", 275, white, [300, 1140], 7.5, 10.4);
        key(swap.transform.position, 7.5, [-900,830], 8.05, [300,830]);
        key(seamlessly.transform.position, 7.7, [-900,1140], 8.25, [300,1140]);
        var ribbonTop = imageLayer(comp, "gold_ribbon.png", "04 | Gold ribbon upper — independent", 7.5, 10.4, [3460, 400], 46, 15);
        var ribbonBottom = imageLayer(comp, "gold_ribbon.png", "04 | Gold ribbon lower — independent", 7.5, 10.4, [3420, 2110], 46, -165);
        key(ribbonTop.transform.position, 7.5, [4200,100], 8.1, [3460,400]);
        key(ribbonBottom.transform.position, 7.5, [3900,2600], 8.2, [3420,2110]);

        // Scene 05: source phone illustration and type remain separate layers.
        solid(comp, "05 | Warm cream background", cream, 10.4, 13.0);
        var own = textLayer(comp, "05 | Own It — editable type", "Own It,", "CabinetGrotesk-Bold", 295, blue, [470, 1120], 10.4, 13.0);
        var flipIt = textLayer(comp, "05 | Flip it — editable type", "Flip it.", "CabinetGrotesk-Bold", 295, blue, [2340, 1120], 10.4, 13.0);
        var phone = imageLayer(comp, "phone.png", "05 | Phone artwork — independent", 10.4, 13.0, [1930, 1050], 35, -4);
        key(phone.transform.scale, 10.4, [24,24], 11.1, [35,35]);
        key(phone.transform.rotation, 10.4, -15, 11.1, -4);
        key(own.transform.opacity, 10.4, 0, 10.75, 100);
        key(flipIt.transform.opacity, 10.6, 0, 10.95, 100);

        comp.markerProperty.setValueAtTime(0, new MarkerValue("Layered Flip prototype | 3840x2160 | 24 fps"));
        comp.openInViewer();
    } catch (e) { alert("Flip build stopped at line " + e.line + ": " + e.toString()); }
    finally { app.endUndoGroup(); }
})();
