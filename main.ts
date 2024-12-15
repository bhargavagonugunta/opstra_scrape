import puppeteer from "puppeteer-extra";
import {createObjectCsvWriter} from 'csv-writer'
// @ts-ignore
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {Page} from "puppeteer";
import {EXPIRES} from "./constants";
puppeteer.use(StealthPlugin());

export const get_strike= (future:number)=>{
    let new_value = future
    while(new_value % 50!=0){
        new_value++;
    }
    return new_value

}
console.log(get_strike( 21819))

let Final_data: any[] =[]

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const csvWriter =createObjectCsvWriter({
    path: 'data1feb.csv',
    header: [
        { id: 'future_price', title: 'future_price' },
        { id: 'CallDelta', title: 'CallDelta' },
        { id: 'CallIV', title: 'CallIV' },
        { id: 'CallLTP', title: 'CallLTP' },
        { id: 'CallOI', title: 'CallOI' },
        { id: 'CallVega', title: 'CallVega' },
        { id: 'PutDelta', title: 'PutDelta' },
        { id: 'PutIV', title: 'PutIV' },
        { id: 'PutLTP', title: 'PutLTP' },
        { id: 'PutOI', title: 'PutOI' },
        { id: 'PutVega', title: 'PutVega' },
        { id: 'Strikes', title: 'Strikes' },
        { id: 'index_x', title: 'index_x' },
        { id: 'index_y', title: 'index_y' },
        { id: 'name', title: 'name' }
    ]
});

const get_option_chain =async (page:Page,k:number)=>{
    for (let i =0 ;i<=250;i++){
        console.log(i)

        const fifteenMints =await page.$('::-p-xpath( //*[@id="app"]/div[32]/main/div/div/div/div/div[3]/div[2]/div[2]/div[4]/div[11])')
        if (fifteenMints) {
            await  fifteenMints.click()
        }
        await delay(100)
        const str =await get_current_date(page);
        console.log("str")
        console.log(str)
        if (str){
            const test = str.split(" ").filter((val)=>val.length > 1);
            console.log("test[0]");
            console.log(test);
            const date_now = str.split(" ").filter((val)=>val.length > 1)[1].substring(0,2);
            const compare = EXPIRES[k].substring(0,2)
            console.log(date_now)
            console.log(compare)
            if (parseInt(compare,10)<parseInt(date_now,10)){
                console.log("breaked")
                break;
            }
        }
        await delay(1000)
        const getchain =await page.$('::-p-xpath( //*[@id="app"]/div[19]/main/div/div/div/div/div[3]/div[2]/div[3]/div[4]/button[2])')
        if (getchain) {
            await  getchain.click()
        }

    }
    return true
}

const  expiry_click = async (page:  any )=> {
    const expirydate = await page.$('::-p-xpath(//*[@id="app"]/div[10]/div/div/div/a/div/div)')
    if (expirydate) {
        await expirydate.click()
    }
}

const get_current_date = async (page:  Page )=> {
   const content =await page.evaluate( ()=>{
       const element =  document.evaluate('/html/body/div/div[32]/main/div/div/div/div/div[3]/div[2]/div[3]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

       return element ? element.textContent : null;
    })
if (content){
    return content
}else {
 // const content = await page.$$('::-p-xpath(/html/body/div/div[20]/main/div/div/div/div/div[3]/div[2]/div[3]/div[2])');
 // console.log("content")
 // console.log(content)
 //    let new_content =''
 //    if (content){
 //        for (let value of content){
 //            console.log(value)
 //        }
 //    }
    return false
}
    // const present = await page.$('::-p-xpath(//*[@id="app"]/div[19]/main/div/div/div/div/div[3]/div[2]/div[3]/div[2])');
    // if (present){
    //    return await present.;
    // }else {
    //     return false;
    // }


}


const write_to_file =async ()=>{
    try {
        console.log('Before entering the loop');
        const new_values = []
        for (const option_chain of Final_data) {
            console.log(option_chain.futuresPrice)
            console.log(option_chain.optionchaindata)
            const future_price =option_chain.futuresPrice
            console.log('Processing option_chain');
            if (option_chain.futuresPrice && option_chain.optionchaindata) {
                const strike = get_strike(Math.ceil(option_chain.futuresPrice))
                console.log("new_data")
                for (const option_data of option_chain.optionchaindata) {
                    console.log("option_data")
                    if (Math.floor(option_data.Strikes) === strike) {
                        option_data.future_price =future_price
                        new_values.push(option_data);
                    }
                }
            }
        }
        console.log('after loop option_chain');
        await csvWriter.writeRecords(new_values)
            .then(() => console.log('CSV file created and data written'));
        return new_values
    }
    catch (e){
        console.error(e)
    }
return []
}


const main = async () => {

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://opstra.definedge.com/')
    // await page.waitForSelector('.v-btn.v-btn--flat.theme--dark');
    // await page.click('v-btn v-btn--flat theme--dark');
    page.on('response', async (response) => {
        if (response.url().includes('https://opstra.definedge.com/api/optionsimulator/optionchain/')) {
            const data = await response.text();
            if (data ){
               const new_data= JSON.parse(data)
                Final_data.push(new_data);
            }
        }
    });

    const loginButton = await page.$("::-p-xpath(//*[@id=\"app\"]/div[2]/nav/div/div[4]/button)");
    if (loginButton) {
        await loginButton.click();
    }
    await delay(1000)
    const username = await page.locator("::-p-xpath(//*[@id=\"username\"])");
    if (username) {
        await username.fill('erugulabhaskar@gmail.com')
    }
    await delay(500)
    const password = page.locator("::-p-xpath(//*[@id=\"password\"])");
    if (password){
        password.fill('w*E9PP-*r#_Nan*')
    }
    await delay(1000)
    const login = await page.$("::-p-xpath(//*[@id=\"kc-login\"])");
    if (login) {
        await login.click();
    }

    await delay(1000)
    await page.goto('https://opstra.definedge.com/options-simulator',{ waitUntil: "networkidle0" });


    const date = await page.locator("::-p-xpath(//*[@id=\"app\"]/div[31]/main/div/div/div/div/div[3]/div[2]/div[2]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/input)");
    if (date) {
        // await date.click();
        await date.fill('')
        await delay(1000)
        await date.fill('29-01-2024')
    }

    // for (let i =0 ;i<=5;i++){
    //     await delay(500)
    //     const date1 = await page.$("::-p-xpath( //*[@id=\"app\"]/div[1]/div/div/div/div[1]/button[1]/div)");
    //     if (date1) {
    //         await date1.click();
    //     }
    // }
    // await delay(500)
    // const datenum = await page.$("::-p-xpath( //*[@id=\"app\"]/div[1]/div/div/div/div[2]/table/tbody/tr[1]/td[2]/button/div)");
    // if (datenum) {
    //     await datenum.click();
    // }
    await delay(1000)

    // const expiry_scrole = await page.locator('::-p-xpath(//*[@id="app"]/div[21])')
    // if (expiry_scrole) {
    //     await expiry_scrole.scroll({scrollTop:2000})
    //     await delay(300)
    //     await expiry_scrole.scroll({scrollTop:1200})
    // }
    await delay(500)

    for (let k =0 ;k<EXPIRES.length;k++){
        const expirys_data =await page.locator('::-p-xpath(//*[@id="app"]/div[20]/main/div/div/div/div/div[3]/div[2]/div[2]/div[3]/div[1]/div/div/div[1]/div[1]/input)')
        if (expirys_data){
            await  expirys_data.click()
            await expirys_data.fill(EXPIRES[k])
        }
        await delay(800)
        await expiry_click(page)
        await delay(1000)
        await get_option_chain(page,k);
        const atm_strikes: any[] = await write_to_file()
            console.log("atm_strikes")
            console.log(atm_strikes)
            console.log("Final_data")

        Final_data=[]
    }
    await delay(500)
}

main()
