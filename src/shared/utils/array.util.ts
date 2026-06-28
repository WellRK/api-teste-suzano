export default class ArrayUtil {

    static union(x, y) {
        var obj = {};
        for (var i = x.length - 1; i >= 0; --i)
            obj[x[i]] = x[i];
        for (var i = y.length - 1; i >= 0; --i)
            obj[y[i]] = y[i];
        var res = []
        for (var k in obj) {
            if (obj.hasOwnProperty(k))
                res.push(obj[k]);
        }
        return res;
    }
}