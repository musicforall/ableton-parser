import path from "path";
import { ascii2hex, hex2ascii, hex2dec, dec2hex, lenPad, replaceAt } from "./utils";

export class FilerefData {
    header: string;
    systemName: string;
    location: string;
    footer: string;
    constructor(header: string, systemName: string, location: string, footer: string) {
        this.header = header;
        this.systemName = systemName;
        this.location = location;
        this.footer = footer;
    }
    getFileName() {
        return path.parse(this.location).base;
    }
    getDir() {
        return path.basename(path.dirname(this.location));
    }
    getLocation(delminator: string) {
        return this.location.split(path.sep).join(delminator);
    }
    getSystemName() {
        return this.systemName;
    }
    getHeader() {
        return this.header;
    }
    getFooter() {
        return this.footer;
    }
    setLocation(location: string) {
        this.location = location;
    }
}

function headEnd(stream:string, index:number) : number{
    if (index > stream.length) throw Error("Data of the ref cannot be recognised: 0200");; 
    // Find the control code 0200
    index = stream.indexOf('0200', index) + 4;
    if  (index == -1) throw Error("Data of the ref cannot be recognised: 0200");; 
    // Check if the control code is exactly the one we need
    let locationLength = hex2dec(stream.substr(index, 2));
    if (stream.substr(index + 4 + (locationLength * 2), 4) == '0E00') return index - 4;
    return headEnd(stream, index + 1);
}

export function unmarshall(stream: string) {
    let cntr = headEnd(stream, 0);
    let header = stream.substr(0, cntr); 
    // Next 4 control code
    cntr += 4;
    // Next 2 location length, 2 padding
    let locationLength = hex2dec(stream.substr(cntr, 2));
    cntr += 4;
    // Next locationLength as Location
    cntr += locationLength * 2;
    
    // Next 4 control code
    if(stream.substr(cntr, 4) != '0E00') throw Error("Data of the ref cannot be recognised: 0E00");
    // Length of total name length blob, 2 padding
    cntr += 4;
    // length of name string, 2 padding
    let nameLength = hex2dec(stream.substr(cntr, 2));
    cntr += 4;
    // Name length with each char with 2 padding
    cntr += nameLength * 2;

    // Next 4 control code
    if(stream.substr(cntr, 4) != '0F00') throw Error("Data of the ref cannot be recognised: 0F00");
    cntr += 4;
    // Length of total sytem name length blob, 2 padding
    cntr += 4;
    // length of system name string, 2 padding
    let systemNameLength = hex2dec(stream.substr(cntr, 2));
    cntr += 4;
    // Name length with each char with 2 padding
    let systemName = hex2ascii(stream.substr(cntr, systemNameLength * 4));
    cntr += systemNameLength * 4;

    // Next 4 control code
    if(stream.substr(cntr, 4) != '1200') throw Error("Data of the ref cannot be recognised: 1200");
    cntr += 4;
    // length of system name string
    locationLength = hex2dec(stream.substr(cntr, 2));
    cntr += 2;
    // Name length with each char with 2 padding
    let location = hex2ascii(stream.substr(cntr, locationLength * 2));
    cntr += locationLength * 2;
    cntr += locationLength % 2 == 0 ? 2 : 4;

    // Next 4 control code
    if(stream.substr(cntr, 4) != '1300') throw Error("Data of the ref cannot be recognised: 1300");
    let footer = stream.substr(cntr);
    
    return new FilerefData(header, systemName, location, footer);
}

export function marshall(data: FilerefData) {
    // Starting 8 Padding, 4 total length, 6 unknown  
    let stream: string = data.getHeader();
    // Control Code
    stream += '0200';
    // length + 2, location with delminator :
    stream += dec2hex(data.getLocation(':').length + 2);
    stream += ascii2hex('/:' + data.getLocation(':'));
    stream += lenPad(data.getLocation(':').length);
    // Control Code
    stream += '0E00';
    // length of the file name with padding and length header (12*2 + 2 = 26), 2 padding
    stream += dec2hex((data.getFileName().length * 2) + 2) + '00';
    stream += dec2hex(data.getFileName().length) + '00';
    stream += ascii2hex(data.getFileName().split('').join('\0')) + '00';
    // Control Code
    stream += '0F00';
    // length of the system name with padding and length header (12*2 + 2 = 26), 2 padding
    stream += dec2hex((data.getSystemName().length * 2) + 2) + '00';
    stream += dec2hex(data.getSystemName().length) + '00';
    stream += ascii2hex(data.getSystemName().split('').join('\0')) + '00';
    // Control Code
    stream += '1200';
    stream += dec2hex(data.getLocation('/').length);
    stream += ascii2hex(data.getLocation('/'));
    stream += lenPad(data.getLocation('/').length);
    // Unknwon end
    stream += data.getFooter();
    // Total size update
    let lenStr = dec2hex(stream.length / 2);
    stream = replaceAt(stream, lenStr, 8);
    return stream;    
}