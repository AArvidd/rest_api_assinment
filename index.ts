import { resolveSync } from "bun";
import { Elysia } from "elysia"
import { filterGlobalHook } from "elysia/utils";
import mongoose, { trusted } from "mongoose"
import { forEachChild } from "typescript";

await mongoose.connect("mongodb+srv://Arvid:mongodb_test@cluster0.nnblr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

const product_schemea = new mongoose.Schema({
    name: {type: String, required: true},
    id: {type: Number, required: true},
    price: {type: Number, required: true},
    amount: Number,
    shelf: Number,
    warehouse: Number,
    supplier: {type: {
        name: String,
        gmail: String,
        phonenumber: Number
    }, required: true}
});

const employee_schema = new mongoose.Schema({
    name: {type: String, require: true},
    position: {type: String, required: true},
    curent_order_id: {type: Number, required: true},
    hours: {type: {
        monday: [{type: Boolean}],
        tuesday: [{type: Boolean}],
        wednesday: [{type: Boolean}],
        thursday: [{type: Boolean}],
        friday: [{type: Boolean}],
        saturday: [{type: Boolean}],
        sunday: [{type: Boolean}]
    }, required: true},
    warehouse: Number
});

const warehouse_schema = new mongoose.Schema({
    number: {type: Number, required: true},
    name: String,
    adress: String
});

const order_schema = new mongoose.Schema({
    customer: {type: {
        name: String,
        adress: String
    },   required: true},
    id: {type: Number, required:true},
    products: [{id: Number, ammount: Number}],
    status: {type: String, required: true},
    timeline: [{type: Date}],
    packager: String,
    driver: String
});


const product = mongoose.model("Pruducts", product_schemea);
const employee = mongoose.model("Employees", employee_schema);
const warehouse = mongoose.model("warehouses", warehouse_schema);
const order = mongoose.model("orders", order_schema);

new Elysia()
    .post("/employees", async({ body, set }) => {
        try {
            let save = new employee(body);
            await save.save();
        } catch (error) {
            set.status = 400
            return error
        }
    })
    .get("/employees", async ({ query }) => {
        if(!query.day){
            let today = new Date();
            let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            query.day = days[today.getDay()];
        }
        let employees = await employee.find({ });
        let working = [];

        employees.forEach(function (worker) {
            if(query.position && worker.position != query.position){
                return;   
            }

            let day = worker.hours[query.day];
            for(let i = 0; i < 96; i++){
                if(day[i]){
                    working.push(worker);
                    break;
                }
            }
        });
        return working;
    })
    .get("/employees/not_working", async ({ query }) => {
        let filter = { curent_order_id: -1 };

        if(query.position){
            filter.position = query.position
        }

        let notWorking = await employee.find(filter)
        return notWorking;
    })

    .post("/roducts", async ({ body, set }) => {
        try {
            let save = new product(body);
            await save.save();
        } catch (error) {
            set.status = 400;
            return(error);
        }
    })
    .get("/pruducts", async ({ query }) => {
        let filter = {}

        if(query.id){
            filter.id = parseInt(query.id);
        }
        if(query.name){
            filter.name = query.name;
        }

        let products = await product.find(filter);
        return products;
    })

    .post("/orders", async ({ body, set }) => {
        try {
            let save = new order(body);
            await save.save();
        } catch (error) {
            set.status = 400;
            return error;
        }
    })
    .get("/orders", async ({ query }) => {
        let orders = await order.find(query);
        return orders;
    })
    .get("orders/oldest", async ({ query }) => {
        let filter = {}
        if(query.status){
            filter.status = query.status
        }
        let orders = await order.find(filter)
        let oldestID = 0;
        for(let i = 1; i < orders.length; i++){
            if( orders[oldestID].timeline[0].getTime() > orders[i].timeline[0].getTime()
            ){
                oldestID = i;
            }
        }
        return orders[oldestID];
    })
    .get("orders/profit", async ({ query }) => {
        let filter = {status: ""};
        if(!query.status){
            filter.status = "finiched";
        }else{
            filter.status = query.status;
        }
        
        let orders = await order.find(filter);

        if(query.month){
            switch(query.month){
                case "january":
                    filter.month = 0;
                    break;
                case "february":
                    filter.month = 1
                    break;
                case "march":
                    filter.month = 2
                    break;
                case "april":
                    filter.month = 3;
                    break;
                case "may":
                    filter.month = 4;
                    break;
                case "june":
                    filter.month = 5;
                    break;
                case "july":
                    filter.month = 6;
                    break;
                case "august":
                    filter.month = 7;
                    break;
                case "september":
                    filter.month = 8;
                    break;
                case "october":
                    filter.month = 9;
                    break;
                case "november":
                    filter.month = 10;
                    break;
                case "december":
                    filter.month = 11;
                    break;
            }
        }

        let out = {};
        let status = 0;
        switch(filter.status){
            case "unasined":
                status = 0;
                break;
            case "pacating":
                status = 1;
                break;
            case "deliverin":
                status = 2;
                break;
            case "finiched":
                status = 3;
                break; 
        }
        
        for(let order of orders){
            if(order.timeline[status].getMonth() != filter.month && query.month){
                continue;
            }


            let value = 0;
            
            for(let i = 0; i < order.products.length; i++){
                let id = order.products[i].id;
                let products = await product.findOne({id: id})
                value += products.price * order.products[i].ammount;
            }
            
            let date = order.timeline[status];
            let stringY = `${date.getFullYear()}`;
            let stringM = `${date.getMonth()}`;
            
            if(!out[stringY]){
                out[stringY] = {};
            }
            if(!out[stringY][stringM]){
                out[stringY][stringM] = 0;
            }
            
            out[stringY][stringM] += value;
            
        }
        return out;

    })
    .get("orders/expensive", async ({ query }) => {
        let filter = {status: ""};
        if(!query.status){
            filter.status = "finiched";
        }else{
            filter.status = query.status;
        }
        
        let orders = await order.find(filter);

        let expensiveValue = 0;
        let index = 0;
        
        for(let i  = 0; i < orders.length; i++){
            let value = 0;
            for(let j = 0; j < orders[i].products.length; j++){
                let id = orders[i].products[j].id;
                let products = await product.findOne({id: id})
                value += products.price * orders[i].products[j].ammount;
            }
            
            if(value > expensiveValue){
                expensiveValue = value;
                index = i
            }
            
        }
        return orders[index];

    })
    .get("orders/expensive/:year/:month", async ({ query, params }) => {
        let filter = {status: ""};
        if(!query.status){
            filter.status = "finiched";
        }else{
            filter.status = query.status;
        }
        
        let orders = await order.find(filter);

        filter.year = +params.year

        switch(params.month){
            case "january":
                filter.month = 0;
                break;
            case "february":
                filter.month = 1
                break;
            case "march":
                filter.month = 2
                break;
            case "april":
                filter.month = 3;
                break;
            case "may":
                filter.month = 4;
                break;
            case "june":
                filter.month = 5;
                break;
            case "july":
                filter.month = 6;
                break;
            case "august":
                filter.month = 7;
                break;
            case "september":
                filter.month = 8;
                break;
            case "october":
                filter.month = 9;
                break;
            case "november":
                filter.month = 10;
                break;
            case "december":
                filter.month = 11;
                break;
        }

        let expensiveValue = 0;
        let index = 0;
        let found = false
        
        let status = 0;
        switch(filter.status){
            case "unasined":
                status = 0;
                break;
            case "pacating":
                status = 1;
                break;
            case "deliverin":
                status = 2;
                break;
            case "finiched":
                status = 3;
                break; 
        }

        for(let i = 0; i < orders.length; i++){
            if(orders[i].timeline[status].getMonth() === filter.month && orders[i].timeline[status].getFullYear() === filter.year){
                index = i;
                found = true
                break;
            }
        }

        for(let i  = index; i < orders.length; i++){
            if(orders[i].timeline[status].getMonth() != filter.month || orders[i].timeline[status].getFullYear() != filter.year){
                continue;
            }

            let value = 0;
            for(let j = 0; j < orders[i].products.length; j++){
                let id = orders[i].products[j].id;
                let products = await product.findOne({id: id})
                value += products.price * orders[i].products[j].ammount;
            }
            
            if(value > expensiveValue){
                expensiveValue = value;
                index = i
            }
            
        }
        if(found){
            return orders[index];
        }else{
            return {}
        }

    })


    // .post =   Create
    // .get =    Read
    // .put =    Uppdate
    // .delete = Delete
    .listen(3030)

console.log("server is on");