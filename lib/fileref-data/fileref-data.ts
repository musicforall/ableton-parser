import path from "path";
import { ascii2hex, hex2ascii, hex2dec, dec2hex, lenPad, replaceAt } from "./utils";

export class FilerefData {
    systemName: string;
    location: string;
    format: string;
    constructor(systemName: string, location: string, format: string) {
        this.systemName = systemName;
        this.location = location;
        this.format = format;
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
    getFormat() {
        return this.format;
    }
    setLocation(location: string) {
        this.location = location;
    }
}

export function unmarshall(stream: string) {
    // Leave the first 8 as padding
    let cntr = 8;
    // 8 to 12 as the total length, 2 padding  
    let totalLength =  hex2dec(stream.substr(cntr, 4));
    cntr += 6;
    // 14 to 20 Unknown
    cntr += 6;
    // 20 to 22 length of System Name
    let systemNameLength = hex2dec(stream.substr(cntr, 2));
    cntr += 2;
    // Next 62 as System Name
    let systemName = hex2ascii(stream.substr(cntr, systemNameLength * 2));
    cntr += 62;
    // Next 8 unknown
    cntr += 8;
    // Next 16 padding with FFFFFFFF
    cntr += 8;
    // 20 to 22 length of File Name
    let fileNameLength = hex2dec(stream.substr(cntr, 2));
    cntr += 2;
    // Next 126 as System Name
    let fileName = hex2ascii(stream.substr(cntr, fileNameLength * 2));
    cntr += 126;
    // Next 16 as padding FFFFFFFF00000000
    cntr += 16;
    // Next 8 file format
    let format = hex2ascii(stream.substr(cntr, 8));
    cntr += 8;
    // Next 16 as padding FFFFFFFF00000000
    cntr += 16;
    // Next 38 unknown
    cntr += 38;
    // Next 2 dir name length
    let dirNameLength = hex2dec(stream.substr(cntr, 2));
    cntr += 2;
    // Next dirNameLength as Directory Name
    let dirName = hex2ascii(stream.substr(cntr, dirNameLength * 2));
    cntr += dirNameLength * 2;
    // Weird padding based on odd or even
    cntr += dirNameLength % 2 == 0 ? 2 : 4; 
    // Next 4 unknown
    cntr += 4;
    // Next 2 location length
    let locationLength = hex2dec(stream.substr(cntr, 2));
    cntr += 2;
    // Next locationLength as Location
    let locationRaw = hex2ascii(stream.substr(cntr, locationLength * 2));
    cntr += locationLength * 2;
    let location = locationRaw.substr(2).split(':').join('/');
    return new FilerefData(systemName, location, format);
}

export function marshall(data: FilerefData) {
    // Starting 8 Padding, 4 total length, 6 unknown  
    let stream: string = '00000000000000020000';
    // 1 size, 63 system name
    stream += dec2hex(data.getSystemName().length);
    stream += ascii2hex(data.getSystemName()).padEnd(62, '0');
    // Unknown 8, buffer 8
    stream += '42440001FFFFFFFF';
    // 1 size, 126 file name
    stream += dec2hex(data.getFileName().length);
    stream += ascii2hex(data.getFileName()).padEnd(126, '0');
    // 16 padding
    stream += 'FFFFFFFF00000000';
    // 8 fileformat
    stream += ascii2hex(data.getFormat());
    // 16 padding
    stream += '00000000FFFFFFFF';
    // 38 Unknown
    stream += '00000A20637500000000000000000000000000';
    // 1 size, 63 dir name, weird padding based on length
    stream += dec2hex(data.getDir().length);
    stream += ascii2hex(data.getDir());
    stream += lenPad(data.getDir().length);
    // Unknown 4
    stream += '0200';
    // length + 2, location with delminator :
    stream += dec2hex(data.getLocation(':').length + 2);
    stream += ascii2hex('/:' + data.getLocation(':'));
    stream += lenPad(data.getLocation(':').length);
    // Unknown 4
    stream += '0E00';
    // length of the file name with padding and length header (12*2 + 2 = 26), 2 padding
    stream += dec2hex((data.getFileName().length * 2) + 2) + '00';
    stream += dec2hex(data.getFileName().length) + '00';
    stream += ascii2hex(data.getFileName().split('').join('\0')) + '00';
    // Unknown 4
    stream += '0F00';
    // length of the system name with padding and length header (12*2 + 2 = 26), 2 padding
    stream += dec2hex((data.getSystemName().length * 2) + 2) + '00';
    stream += dec2hex(data.getSystemName().length) + '00';
    stream += ascii2hex(data.getSystemName().split('').join('\0')) + '00';
    // Unknown 4
    stream += '1200';
    stream += dec2hex(data.getLocation('/').length);
    stream += ascii2hex(data.getLocation('/'));
    stream += lenPad(data.getLocation('/').length);
    // Unknwon end
    stream += '1300012F00001500020015FFFF0000';
    let lenStr = dec2hex(stream.length / 2);
    stream = replaceAt(stream, lenStr, 8);
    return stream;    
}