export interface Vector3 {
     x: number,
     y: number,
     z: number
}
export const CalculateDistance = async(p1:Vector3, p2:Vector3) => {
     var a = p2.x - p1.x;
     var b = p2.y - p1.y;
     var c = p2.z - p1.z; 
     return Math.sqrt(a * a + b * b + c * c);
}
export function SplitSpaces(a:String): String {
     a = String(a)
     return a.split(' ').join('')
}
export function IsJson(str) {
     try {
          JSON.parse(str);
     }catch(e) {
          return false
     }
     return true
}
export function ArrayToVec3(coords: number[]): Vector3 {
     return {
       x: coords[0],
       y: coords[1],
       z: coords[2],
     };
}
export const MathRandom = async(min, max) => {
     return Math.floor(Math.random()*(max-min+1)+min);
}
export const Wait = (ms) => new Promise(res => setTimeout(res, ms));
export const Fetch = async (query: string, params: any) => {
     let res = {}
     let finishedQuery = false
     globalThis.exports['mysql-async'].mysql_fetch_all(query, params, function(result) {
          finishedQuery = true
          res = result
     })
     while (!finishedQuery) {await Wait(100)}
     return res
};
export const Execute = async (query: string, params: any) => {
     let res = {}
     let finishedQuery = false
     globalThis.exports['mysql-async'].mysql_execute(query, params, function(result) {
          finishedQuery = true
          res = result
     })
     while (!finishedQuery) {await Wait(100)}
     return res
};