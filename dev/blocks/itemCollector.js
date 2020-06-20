IDRegistry.genBlockID("itemCollector");

Block.createBlock("itemCollector", [{
    name: "Item Collector",
    texture: [
        ["itemCollector", 0]
    ],
    inCreative: true
}], 'opaque');
mod_tip(BlockID.itemCollector);

Recipes.addShaped({
    id: BlockID.itemCollector,
    count: 1,
    data: 0
}, [
    "cpc",
    "php",
    "cpc"
], ['h', 410, 0, 'p', 381, 0, 'c', 54, 0]);

var itemColRad = 10;

TileEntity.registerPrototype(BlockID.itemCollector, {
    defaultValues: {
        ticks: 0
    },
    getTransportSlots: function() {
        return {
            //input: ["slot"],
            output: ["slot"]
        };
    },
    click: function(id, count, data) {
        var container_slot = this.container.getSlot("slot");
        if (container_slot.id == 0) return Game.message('Not available');
        Game.message(Item.getName(container_slot.id, container_slot.data).split('\n')[0] + ' * ' + container_slot.count);
    },
    tick: function() {
        this.data.ticks++
        if (this.data.ticks >= 5) {
            this.data.ticks = 0;
            var container_slot = this.container.getSlot("slot");
            var x, y, z;
            x = y = z = 0;
            for (var i in sides) {
                if (World.getContainer(this.x + sides[i][0], this.y + sides[i][1], this.z + sides[i][2]) || World.addTileEntity(this.x + sides[i][0], this.y + sides[i][1], this.z + sides[i][2]) || World.getTileEntity(this.x + sides[i][0], this.y + sides[i][1], this.z + sides[i][2])) {
                    x = sides[i][0];
                    y = sides[i][1];
                    z = sides[i][2];
                    break;
                }
            }
            if (x != 0 || y != 0 || z != 0) {
                if (container_slot.id != 0) {
                    var container = World.getContainer(this.x + x, this.y + y, this.z + z)
                    var tile = World.addTileEntity(this.x + x, this.y + y, this.z + z) || World.getTileEntity(this.x + x, this.y + y, this.z + z);
                    if (container || tile) {
                        //Game.message('Tile entity found');
                        if (tile && tile.getTransportSlots && tile.getTransportSlots().input) {
                            //Game.message('This is mod tile');
                            container = tile.container;
                            var size = tile.getTransportSlots().input.length
                            var slot;
                            for (var l = 0; l < size; l++) {
                                var item = container.getSlot(tile.getTransportSlots().input[l]);
                                if(!item) continue;
                                if (item.id == 0 || (item.id == container_slot.id && item.data == container_slot.data && item.count < Item.getMaxStack(container_slot.id) && item.extra ==  container_slot.extra)) {
                                    slot = tile.getTransportSlots().input[l];
                                    break;
                                    //Game.message('Slot of mod tile found');
                                }
                            };
                            if(slot){
                                var slot_item = container.getSlot(slot);
                                var max_stack = Item.getMaxStack(container_slot.id);
                                var count = Math.min(container_slot.count + slot_item.count, max_stack);
                                var other = Math.max(container_slot.count + slot_item.count - max_stack, 0);
                                container.setSlot(slot, container_slot.id, count, container_slot.data, container_slot.extra || null);
                                container_slot.count = other;
                                if (container_slot.count <= 0) {
                                    container_slot.id = 0;
                                }
                            }
                        } else if (container) {
                            //Game.message('This is vanilla tile');
                            var size = container.size
                            var slot;
                            for (var l = 0; l < size; l++) {
                                var item = container.getSlot(l);
                                if (item.id == 0 || (item.id == container_slot.id && item.data == container_slot.data && item.extra == container_slot.extra && item.count < Item.getMaxStack(container_slot.id))) {
                                    slot = l;
                                    break;
                                    //Game.message('Slot of vanilla tile found');
                                }
                            };
                            if(slot >= 0) {
                                var slot_item = container.getSlot(slot);
                                var max_stack = Item.getMaxStack(container_slot.id);
                                var count = Math.min(container_slot.count + slot_item.count, max_stack);
                                var other = Math.max(container_slot.count + slot_item.count - max_stack, 0);
                                container.setSlot(slot, container_slot.id, count, container_slot.data, container_slot.extra || null);
                                container_slot.count = other;
                                if (container_slot.count <= 0) {
                                    container_slot.id = 0;
                                }
                            }
                        }
                    }
                }
            }
            var ents = Entity.getAllInRange(this, itemColRad, 64);
            for (var i in ents) {
                var ent = ents[i];
                if (!ent) continue;
                var item = Entity.getDroppedItem(ent);
                if(!item) continue;
                var max_stack = Item.getMaxStack(item.id);
                if (item.id == container_slot.id && item.data == container_slot.data && item.extra == container_slot.extra) {
                    var count = Math.min(container_slot.count + item.count, max_stack);
                    var other = Math.max(container_slot.count + item.count - max_stack, 0);
                    if(other == 0)
                        Entity.remove(ent);
                    else
                        Entity.setDroppedItem(ent, item.id, other, item.data, item.extra);
                    container_slot.count = other;
                    if (container_slot.count <= 0) {
                        container_slot.id = 0;
                    }
                } else if (container_slot.id == 0) {
                    var other = Math.max(container_slot.count + item.count - max_stack, 0);
                    this.container.setSlot("slot", item.id, Math.min(item.count, max_stack), item.data, item.extra || null);
                    if(other == 0)
                        Entity.remove(ent);
                    else
                        Entity.setDroppedItem(ent, item.id, other, item.data, item.extra);
                }
            }

        }
    }
});

ModAPI.addAPICallback("WailaAPI", function(api) {
    api.Waila.addExtension(BlockID.itemCollector, function(id, data, elements, tile, yPos) {
        var item = tile.container.getSlot("slot");
        item.name = Item.getName(item.id, item.data) + " * " + item.count;
        if (!Item.getName(item.id, item.data)) item.name = "Not available";
        elements["itemCollector_slot"] = {
            type: "text",
            text: "Item: " + item.name,
            x: 200,
            y: yPos,
            font: {
                color: api.Style.DEF,
                size: 40
            }
        };
        yPos += 60;

        api.Waila.requireHeight(20);
        return yPos;
    })
})