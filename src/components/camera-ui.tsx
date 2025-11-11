'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { SwitchCamera, Loader2, ZoomIn, ZoomOut, QrCode, Copy, X, Languages, Download, Zap, ZapOff, Type, Smile, BarChart2 } from 'lucide-react';
import PhotoLocationView from './photo-location-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { identifyObject, translateTextInImage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import ArSnapshotView from './ar-snapshot-view';
import CameraStats from './camera-stats';
import { Wand2 } from 'lucide-react';
import { Slider } from './ui/slider';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from './language-switcher';
import { AnimatePresence, motion } from 'framer-motion';
import { useCameraStore } from '@/store/camera-store';
import { FaceMesh } from '@mediapipe/face_mesh';

function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    connections: [number, number][],
    options: { color: string; lineWidth: number }
  ) {
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.lineWidth;
    for (const connection of connections) {
      const start = landmarks[connection[0]];
      const end = landmarks[connection[1]];
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
}
const FACEMESH_TESSELATION = [
    [127, 34], [34, 139], [139, 127], [11, 0], [0, 37], [37, 11], [232, 231], [231, 120], [120, 232],
    [72, 37], [37, 39], [39, 72], [128, 121], [121, 47], [47, 128], [232, 121], [121, 128], [128, 232],
    [104, 69], [69, 67], [67, 104], [175, 171], [171, 148], [148, 175], [118, 50], [50, 101], [101, 118],
    [73, 39], [39, 40], [40, 73], [9, 151], [151, 108], [108, 9], [48, 115], [115, 131], [131, 48],
    [194, 204], [204, 211], [211, 194], [74, 40], [40, 185], [185, 74], [80, 42], [42, 183], [183, 80],
    [40, 92], [92, 186], [186, 40], [230, 229], [229, 118], [118, 230], [202, 212], [212, 214], [214, 202],
    [83, 18], [18, 17], [17, 83], [76, 61], [61, 146], [146, 76], [160, 29], [29, 30], [30, 160],
    [56, 157], [157, 173], [173, 56], [106, 204], [204, 194], [194, 106], [135, 214], [214, 192], [192, 135],
    [203, 165], [165, 98], [98, 203], [21, 71], [71, 68], [68, 21], [51, 45], [45, 4], [4, 51],
    [144, 24], [24, 23], [23, 144], [77, 146], [146, 91], [91, 77], [205, 50], [50, 187], [187, 205],
    [201, 200], [200, 18], [18, 201], [91, 106], [106, 182], [182, 91], [90, 91], [91, 181], [181, 90],
    [85, 84], [84, 17], [17, 85], [206, 203], [203, 36], [36, 206], [148, 171], [171, 140], [140, 148],
    [92, 40], [40, 39], [39, 92], [193, 189], [189, 244], [244, 193], [159, 158], [158, 28], [28, 159],
    [247, 246], [246, 161], [161, 247], [236, 3], [3, 196], [196, 236], [54, 68], [68, 104], [104, 54],
    [193, 168], [168, 8], [8, 193], [117, 228], [228, 31], [31, 117], [189, 193], [193, 55], [55, 189],
    [98, 97], [97, 99], [99, 98], [126, 47], [47, 100], [100, 126], [166, 79], [79, 218], [218, 166],
    [155, 154], [154, 26], [26, 155], [209, 49], [49, 131], [131, 209], [135, 136], [136, 150], [150, 135],
    [47, 126], [126, 217], [217, 47], [223, 52], [52, 53], [53, 223], [45, 51], [51, 134], [134, 45],
    [211, 170], [170, 140], [140, 211], [67, 69], [69, 108], [108, 67], [43, 106], [106, 91], [91, 43],
    [230, 119], [119, 120], [120, 230], [226, 130], [130, 247], [247, 226], [63, 53], [53, 52], [52, 63],
    [238, 20], [20, 242], [242, 238], [46, 70], [70, 156], [156, 46], [78, 62], [62, 96], [96, 78],
    [46, 53], [53, 63], [63, 46], [143, 34], [34, 227], [227, 143], [123, 117], [117, 111], [111, 123],
    [44, 125], [125, 19], [19, 44], [236, 134], [134, 51], [51, 236], [216, 206], [206, 205], [205, 216],
    [154, 153], [153, 22], [22, 154], [39, 37], [37, 167], [167, 39], [200, 201], [201, 208], [208, 200],
    [36, 142], [142, 100], [100, 36], [57, 212], [212, 202], [202, 57], [20, 60], [60, 99], [99, 20],
    [28, 158], [158, 157], [157, 28], [35, 226], [226, 113], [113, 35], [160, 159], [159, 27], [27, 160],
    [204, 202], [202, 210], [210, 204], [113, 225], [225, 46], [46, 113], [43, 202], [202, 204], [204, 43],
    [62, 76], [76, 77], [77, 62], [137, 123], [123, 116], [116, 137], [41, 38], [38, 72], [72, 41],
    [203, 129], [129, 142], [142, 203], [64, 98], [98, 240], [240, 64], [49, 102], [102, 64], [64, 49],
    [41, 73], [73, 74], [74, 41], [212, 216], [216, 207], [207, 212], [42, 74], [74, 184], [184, 42],
    [169, 170], [170, 211], [211, 169], [170, 149], [149, 176], [176, 170], [105, 66], [66, 69], [69, 105],
    [122, 6], [6, 168], [168, 122], [123, 147], [147, 187], [187, 123], [96, 77], [77, 90], [90, 96],
    [65, 55], [55, 107], [107, 65], [89, 90], [90, 180], [180, 89], [101, 100], [100, 120], [120, 101],
    [63, 105], [105, 104], [104, 63], [93, 137], [137, 227], [227, 93], [15, 86], [86, 85], [85, 15],
    [129, 102], [102, 49], [49, 129], [14, 87], [87, 86], [86, 14], [55, 8], [8, 9], [9, 55],
    [100, 47], [47, 121], [121, 100], [145, 23], [23, 22], [22, 145], [88, 89], [89, 179], [179, 88],
    [6, 122], [122, 196], [196, 6], [88, 95], [95, 96], [96, 88], [138, 172], [172, 136], [136, 138],
    [215, 58], [58, 172], [172, 215], [115, 48], [48, 219], [219, 115], [42, 80], [80, 81], [81, 42],
    [195, 3], [3, 51], [51, 195], [43, 146], [146, 61], [61, 43], [171, 175], [175, 199], [199, 171],
    [81, 82], [82, 38], [38, 81], [53, 46], [46, 225], [225, 53], [144, 163], [163, 110], [110, 144],
    [52, 65], [65, 66], [66, 52], [229, 228], [228, 117], [117, 229], [34, 127], [127, 234], [234, 34],
    [107, 108], [108, 69], [69, 107], [109, 108], [108, 151], [151, 109], [48, 64], [64, 235], [235, 48],
    [62, 78], [78, 191], [191, 62], [129, 209], [209, 126], [126, 129], [111, 35], [35, 143], [143, 111],
    [117, 123], [123, 50], [50, 117], [222, 65], [65, 52], [52, 222], [19, 125], [125, 141], [141, 19],
    [221, 55], [55, 65], [65, 221], [3, 195], [195, 197], [197, 3], [25, 7], [7, 33], [33, 25],
    [220, 237], [237, 44], [44, 220], [70, 71], [71, 139], [139, 70], [122, 193], [193, 245], [245, 122],
    [247, 130], [130, 33], [33, 247], [71, 21], [21, 162], [162, 71], [170, 169], [169, 150], [150, 170],
    [188, 174], [174, 196], [196, 188], [216, 186], [186, 92], [92, 216], [2, 97], [97, 167], [167, 2],
    [141, 125], [125, 241], [241, 141], [164, 167], [167, 37], [37, 164], [72, 38], [38, 12], [12, 72],
    [38, 82], [82, 13], [13, 38], [63, 68], [68, 71], [71, 63], [226, 35], [35, 111], [111, 226],
    [101, 50], [50, 205], [205, 101], [206, 92], [92, 165], [165, 206], [209, 198], [198, 217], [217, 209],
    [165, 167], [167, 97], [97, 165], [220, 115], [115, 218], [218, 220], [133, 112], [112, 243], [243, 133],
    [239, 238], [238, 241], [241, 239], [214, 135], [135, 169], [169, 214], [190, 173], [173, 133], [133, 190],
    [171, 208], [208, 32], [32, 171], [125, 44], [44, 237], [237, 125], [86, 87], [87, 178], [178, 86],
    [85, 86], [86, 179], [179, 85], [84, 85], [85, 180], [180, 84], [83, 84], [84, 181], [181, 83],
    [201, 83], [83, 182], [182, 201], [137, 93], [93, 132], [132, 137], [76, 62], [62, 183], [183, 76],
    [61, 76], [76, 184], [184, 61], [57, 61], [61, 185], [185, 57], [212, 57], [57, 186], [186, 212],
    [214, 207], [207, 187], [187, 214], [34, 143], [143, 156], [156, 34], [79, 239], [239, 237], [237, 79],
    [123, 137], [137, 177], [177, 123], [44, 1], [1, 4], [4, 44], [201, 194], [194, 32], [32, 201],
    [64, 102], [102, 129], [129, 64], [213, 215], [215, 138], [138, 213], [59, 166], [166, 219], [219, 59],
    [242, 99], [99, 97], [97, 242], [2, 94], [94, 141], [141, 2], [75, 59], [59, 235], [235, 75],
    [24, 110], [110, 228], [228, 24], [25, 130], [130, 226], [226, 25], [23, 24], [24, 229], [229, 23],
    [22, 23], [23, 230], [230, 22], [26, 22], [22, 231], [231, 26], [112, 26], [26, 232], [232, 112],
    [189, 190], [190, 243], [243, 189], [221, 56], [56, 190], [190, 221], [28, 56], [56, 221], [221, 28],
    [27, 28], [28, 222], [222, 27], [29, 27], [27, 223], [223, 29], [30, 29], [29, 224], [224, 30],
    [247, 30], [30, 225], [225, 247], [238, 79], [79, 20], [20, 238], [166, 59], [59, 75], [75, 166],
    [60, 75], [75, 240], [240, 60], [147, 177], [177, 215], [215, 147], [20, 79], [79, 166], [166, 20],
    [187, 147], [147, 213], [213, 187], [112, 233], [233, 244], [244, 112], [233, 128], [128, 245], [245, 233],
    [128, 114], [114, 188], [188, 128], [114, 217], [217, 174], [174, 114], [131, 115], [115, 220], [220, 131],
    [217, 198], [198, 236], [236, 217], [198, 131], [131, 134], [134, 198], [177, 132], [132, 58], [58, 177],
    [143, 35], [35, 124], [124, 143], [110, 163], [163, 7], [7, 110], [228, 110], [110, 25], [25, 228],
    [356, 389], [389, 368], [368, 356], [11, 302], [302, 267], [267, 11], [452, 350], [350, 349], [349, 452],
    [302, 303], [303, 269], [269, 302], [357, 343], [343, 277], [277, 357], [452, 453], [453, 357], [357, 452],
    [333, 332], [332, 297], [297, 333], [175, 152], [152, 377], [377, 175], [347, 348], [348, 330], [330, 347],
    [303, 304], [304, 270], [270, 303], [9, 336], [336, 337], [337, 9], [278, 279], [279, 360], [360, 278],
    [418, 262], [262, 431], [431, 418], [304, 408], [408, 409], [409, 304], [310, 415], [415, 407], [407, 310],
    [270, 409], [409, 410], [410, 270], [450, 348], [348, 347], [347, 450], [422, 430], [430, 434], [434, 422],
    [313, 314], [314, 17], [17, 313], [306, 307], [307, 375], [375, 306], [387, 388], [388, 260], [260, 387],
    [286, 414], [414, 398], [398, 286], [335, 406], [406, 418], [418, 335], [364, 367], [367, 416], [416, 364],
    [423, 358], [358, 327], [327, 423], [251, 284], [284, 298], [298, 251], [281, 5], [5, 4], [4, 281],
    [373, 374], [374, 253], [253, 373], [307, 320], [320, 321], [321, 307], [425, 427], [427, 411], [411, 425],
    [421, 313], [313, 18], [18, 421], [321, 405], [405, 406], [406, 321], [320, 404], [404, 405], [405, 320],
    [315, 16], [16, 17], [17, 315], [426, 425], [425, 266], [266, 426], [377, 400], [400, 369], [369, 377],
    [322, 391], [391, 269], [269, 322], [417, 465], [465, 464], [464, 417], [386, 257], [257, 258], [258, 386],
    [466, 260], [260, 388], [388, 466], [456, 399], [399, 419], [419, 456], [284, 332], [332, 333], [333, 284],
    [417, 285], [285, 8], [8, 417], [346, 340], [340, 261], [261, 346], [413, 441], [441, 285], [285, 413],
    [327, 460], [460, 328], [328, 327], [355, 371], [371, 329], [329, 355], [392, 439], [439, 438], [438, 392],
    [382, 341], [341, 256], [256, 382], [429, 420], [420, 360], [360, 429], [364, 394], [394, 379], [379, 364],
    [277, 343], [343, 437], [437, 277], [443, 444], [444, 283], [283, 443], [275, 440], [440, 363], [363, 275],
    [431, 262], [262, 369], [369, 431], [297, 338], [338, 337], [337, 297], [273, 375], [375, 321], [321, 273],
    [450, 451], [451, 349], [349, 450], [446, 342], [342, 467], [467, 446], [293, 334], [334, 282], [282, 293],
    [458, 461], [461, 462], [462, 458], [276, 353], [353, 383], [383, 276], [308, 324], [324, 325], [325, 308],
    [276, 300], [300, 293], [293, 276], [372, 345], [345, 447], [447, 372], [352, 345], [345, 340], [340, 352],
    [274, 1], [1, 19], [19, 274], [456, 248], [248, 281], [281, 456], [436, 427], [427, 425], [425, 436],
    [381, 256], [256, 252], [252, 381], [269, 391], [391, 393], [393, 269], [200, 199], [199, 428], [428, 200],
    [266, 330], [330, 329], [329, 266], [287, 273], [273, 422], [422, 287], [250, 462], [462, 328], [328, 250],
    [258, 286], [286, 384], [384, 258], [265, 353], [353, 342], [342, 265], [387, 259], [259, 257], [257, 387],
    [424, 431], [431, 430], [430, 424], [342, 353], [353, 276], [276, 342], [273, 335], [335, 424], [424, 273],
    [292, 325], [325, 307], [307, 292], [366, 447], [447, 345], [345, 366], [271, 303], [303, 302], [302, 271],
    [423, 266], [266, 371], [371, 423], [294, 455], [455, 460], [460, 294], [279, 278], [278, 294], [294, 279],
    [271, 272], [272, 304], [304, 271], [432, 434], [434, 427], [427, 432], [272, 407], [407, 408], [408, 272],
    [394, 430], [430, 431], [431, 394], [395, 369], [369, 400], [400, 395], [334, 333], [333, 299], [299, 334],
    [351, 417], [417, 168], [168, 351], [352, 280], [280, 411], [411, 352], [325, 319], [319, 320], [320, 325],
    [295, 296], [296, 336], [336, 295], [319, 403], [403, 404], [404, 319], [330, 348], [348, 349], [349, 330],
    [293, 298], [298, 333], [333, 293], [323, 454], [454, 447], [447, 323], [15, 16], [16, 315], [315, 15],
    [358, 429], [429, 279], [279, 358], [14, 15], [15, 316], [316, 14], [285, 336], [336, 9], [9, 285],
    [329, 349], [349, 350], [350, 329], [374, 380], [380, 252], [252, 374], [318, 402], [402, 403], [403, 318],
    [6, 197], [197, 419], [419, 6], [318, 319], [319, 325], [325, 318], [367, 364], [364, 365], [365, 367],
    [435, 367], [367, 397], [397, 435], [344, 438], [438, 439], [439, 344], [272, 271], [271, 311], [311, 272],
    [195, 5], [5, 281], [281, 195], [273, 287], [287, 291], [291, 273], [396, 428], [428, 199], [199, 396],
    [311, 271], [271, 268], [268, 311], [283, 444], [444, 445], [445, 283], [373, 254], [254, 339], [339, 373],
    [282, 334], [334, 296], [296, 282], [449, 347], [347, 346], [346, 449], [264, 447], [447, 454], [454, 264],
    [336, 296], [296, 299], [299, 336], [338, 10], [10, 151], [151, 338], [278, 439], [439, 455], [455, 278],
    [292, 407], [407, 415], [415, 292], [358, 371], [371, 355], [355, 358], [340, 345], [345, 372], [372, 340],
    [346, 347], [347, 280], [280, 346], [442, 443], [443, 282], [282, 442], [19, 94], [94, 370], [370, 19],
    [441, 442], [442, 295], [295, 441], [248, 419], [419, 197], [197, 248], [263, 255], [255, 359], [359, 263],
    [440, 275], [275, 274], [274, 440], [300, 383], [383, 368], [368, 300], [351, 412], [412, 465], [465, 351],
    [263, 467], [467, 466], [466, 263], [301, 368], [368, 389], [389, 301], [395, 378], [378, 379], [379, 395],
    [412, 351], [351, 419], [419, 412], [436, 426], [426, 322], [322, 436], [2, 164], [164, 393], [393, 2],
    [370, 462], [462, 461], [461, 370], [164, 0], [0, 267], [267, 164], [302, 11], [11, 12], [12, 302],
    [268, 12], [12, 13], [13, 268], [293, 300], [300, 301], [301, 293], [446, 261], [261, 340], [340, 446],
    [330, 266], [266, 425], [425, 330], [426, 423], [423, 391], [391, 426], [429, 355], [355, 437], [437, 429],
    [391, 327], [327, 326], [326, 391], [440, 457], [457, 438], [438, 440], [341, 382], [382, 362], [362, 341],
    [459, 457], [457, 461], [461, 459], [434, 430], [430, 394], [394, 434], [414, 463], [463, 362], [362, 414],
    [396, 369], [369, 262], [262, 396], [354, 461], [461, 457], [457, 354], [316, 403], [403, 402], [402, 316],
    [315, 404], [404, 403], [403, 315], [314, 405], [405, 404], [404, 314], [313, 406], [406, 405], [405, 313],
    [421, 418], [418, 406], [406, 421], [366, 401], [401, 361], [361, 366], [306, 408], [408, 407], [407, 306],
    [291, 409], [409, 408], [408, 291], [287, 410], [410, 409], [409, 287], [432, 436], [436, 410], [410, 432],
    [434, 416], [416, 411], [411, 434], [264, 368], [368, 383], [383, 264], [309, 438], [438, 457], [457, 309],
    [352, 376], [376, 401], [401, 352], [274, 275], [275, 4], [4, 274], [421, 428], [428, 262], [262, 421],
    [294, 327], [327, 358], [358, 294], [433, 416], [416, 367], [367, 433], [289, 455], [455, 439], [439, 289],
    [462, 370], [370, 326], [326, 462], [2, 326], [326, 370], [370, 2], [305, 460], [460, 455], [455, 305],
    [254, 449], [449, 448], [448, 254], [255, 261], [261, 446], [446, 255], [253, 450], [450, 449], [449, 253],
    [252, 451], [451, 450], [450, 252], [256, 452], [452, 451], [451, 256], [341, 453], [453, 452], [452, 341],
    [413, 464], [464, 463], [463, 413], [441, 413], [413, 414], [414, 441], [258, 442], [442, 441], [441, 258],
    [257, 443], [443, 442], [442, 257], [259, 444], [444, 443], [443, 259], [260, 445], [445, 444], [444, 260],
    [467, 342], [342, 445], [445, 467], [459, 458], [458, 250], [250, 459], [289, 392], [392, 290], [290, 289],
    [290, 328], [328, 460], [460, 290], [376, 433], [433, 435], [435, 376], [250, 290], [290, 392], [392, 250],
    [411, 416], [416, 433], [433, 411], [341, 463], [463, 464], [464, 341], [453, 464], [464, 465], [465, 453],
    [357, 465], [465, 412], [412, 357], [343, 412], [412, 399], [399, 343], [360, 363], [363, 440], [440, 360],
    [437, 399], [399, 456], [456, 437], [420, 456], [456, 363], [363, 420], [401, 435], [435, 288], [288, 401],
    [372, 383], [383, 353], [353, 372], [339, 255], [255, 249], [249, 339], [448, 261], [261, 255], [255, 448]
];

export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const touchStartDistance = useRef<number>(0);
  const lastZoom = useRef<number>(1);
  const faceMeshRef = useRef<FaceMesh | null>(null);

  const { toast } = useToast();
  const t = useTranslations('CameraUI');
  const locale = useLocale();

  const {
    mode,
    setMode,
    facingMode,
    setFacingMode,
    capturedImage,
    setCapturedImage,
    isCameraReady,
    setIsCameraReady,
    arSnapshot,
    setArSnapshot,
    zoom,
    setZoom,
    zoomCapabilities,
    setZoomCapabilities,
    qrCode,
    setQrCode,
    videoTrack,
    setVideoTrack,
    isRecording,
    setIsRecording,
    recordedVideo,
    setRecordedVideo,
    hasTorch,
    setHasTorch,
    isTorchOn,
    setIsTorchOn,
    reset,
  } = useCameraStore();
  
  const [faceModelReady, setFaceModelReady] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [translatedText, setTranslatedText] = useState<{ text: string, box: any } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const loadFaceModel = useCallback(() => {
    if (faceMeshRef.current) return;
    setFaceModelReady(false);
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    faceMesh.onResults(onFaceResults);

    faceMesh.initialize().then(() => {
        faceMeshRef.current = faceMesh;
        setFaceModelReady(true);
    });

  }, []);
  
  const onFaceResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        drawConnectors(ctx, landmarks, FACEMESH_TESSELATION,
                       {color: '#C0C0C070', lineWidth: 1});
      }
    }
    ctx.restore();
  };
  
  const detectFace = useCallback(async () => {
    if (faceMeshRef.current && videoRef.current) {
        await faceMeshRef.current.send({image: videoRef.current});
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    setZoomCapabilities(null);
    setZoom(1);
    setHasTorch(false);
    setIsTorchOn(false);

    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            advanced: [{ focusMode: 'continuous' }]
          },
          audio: true
        });
        videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        setVideoTrack(track);
        
        const capabilities = track.getCapabilities();
        if ('torch' in capabilities) {
          setHasTorch(!!capabilities.torch);
        }

        if ('zoom' in capabilities && capabilities.zoom) {
          setZoomCapabilities({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          });
          lastZoom.current = 1;
        }
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          variant: "destructive",
          title: t('camera_error_toast_title'),
          description: t('camera_error_toast_description'),
        });
        if (facingMode === 'environment') {
          setFacingMode('user');
        }
      }
    }
  }, [facingMode, setIsCameraReady, setVideoTrack, setZoom, setZoomCapabilities, t, toast, setFacingMode, setHasTorch, setIsTorchOn]);

  const stopDetectionMode = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, []);

  const stopQrMode = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  }, []);
  
  const stopTextMode = useCallback(() => {
    setTranslatedText(null);
  }, []);

  const scanQrCode = useCallback(() => {
    if (videoRef.current && canvasRef.current && !qrCode) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrCode(code.data);
          stopQrMode();
        }
      }
    }
  }, [qrCode, stopQrMode, setQrCode]);

  const startQrMode = useCallback(() => {
    stopQrMode();
    if (isCameraReady && !qrCode) {
        qrIntervalRef.current = setInterval(scanQrCode, 500);
    }
  }, [isCameraReady, qrCode, stopQrMode, scanQrCode]);

  useEffect(() => {
    loadFaceModel();

    return () => {
        faceMeshRef.current?.close();
    }
  }, [loadFaceModel]);


  useEffect(() => {
    stopDetectionMode();
    stopQrMode();
    stopTextMode();
    
    if (mode === 'SMILE' && isCameraReady && faceModelReady) {
      detectionIntervalRef.current = setInterval(detectFace, 100);
    } else if (mode === 'QR' && isCameraReady) {
      startQrMode();
    }
    
    return () => {
      stopDetectionMode();
      stopQrMode();
      stopTextMode();
    }
  }, [mode, isCameraReady, faceModelReady, detectFace, stopDetectionMode, stopQrMode, startQrMode, stopTextMode]);


  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      stopDetectionMode();
      stopQrMode();
      stopTextMode();
      reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);
  
  const handleZoomChange = useCallback((newZoom: number) => {
    if (videoTrack && zoomCapabilities) {
        try {
            const clampedZoom = Math.max(zoomCapabilities.min, Math.min(newZoom, zoomCapabilities.max));
            videoTrack.applyConstraints({ advanced: [{ zoom: clampedZoom }] });
            setZoom(clampedZoom);
        } catch (error) {
            console.error('Zoom not supported or value out of range:', error);
        }
    }
  }, [videoTrack, zoomCapabilities, setZoom]);

  const handleTouchStart = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        touchStartDistance.current = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
        lastZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLVideoElement>) => {
      if (e.touches.length === 2 && zoomCapabilities) {
          e.preventDefault();
          const currentDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
          );
          const zoomFactor = currentDistance / touchStartDistance.current;
          const newZoom = lastZoom.current * zoomFactor;
          handleZoomChange(newZoom);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length < 2) {
        touchStartDistance.current = 0;
    }
  };

  const toggleTorch = useCallback(() => {
    if (videoTrack && hasTorch) {
      const nextTorchState = !isTorchOn;
      videoTrack.applyConstraints({ advanced: [{ torch: nextTorchState }] })
        .then(() => {
          setIsTorchOn(nextTorchState);
        })
        .catch(e => console.error('Failed to toggle torch:', e));
    }
  }, [videoTrack, hasTorch, isTorchOn, setIsTorchOn]);

  const handleFlipCamera = () => {
    stopDetectionMode();
    stopQrMode();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      recordedChunksRef.current = [];
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = async () => {
    if (mode === 'VIDEO') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
      return;
    }
    
    if (mode === 'TEXT') {
      if (videoRef.current && canvasRef.current && !isTranslating) {
        setIsTranslating(true);
        setTranslatedText(null);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            
            const result = await translateTextInImage(dataUrl, locale === 'cs' ? 'Czech' : 'English');
            
            if (result.translatedText) {
                setTranslatedText({ text: result.translatedText, box: { x: 0, y: 0, width: canvas.width, height: canvas.height/4 } });
            } else {
                toast({ variant: 'destructive', title: "Translation Failed", description: result.error });
            }
        }
        setIsTranslating(false);
      }
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
        if (mode === 'AR') {
            const objectName = 'placeholder'
            setArSnapshot({ image: dataUrl, label: t('ar_processing'), description: '' });
            identifyObject(objectName).then(result => {
                setArSnapshot({
                    image: dataUrl,
                    label: objectName,
                    description: result.description || (result.error ? result.error as string : 'Could not get a description.')
                });
            });
      } else {
          setCapturedImage(dataUrl);
      }
      }
    }
  };

  const handleCopyQrCode = () => {
    if (qrCode) {
        navigator.clipboard.writeText(qrCode);
        toast({
            title: t('copied_toast_title'),
            description: t('copied_toast_description'),
        });
    }
  }

  const handleDismissQrCode = () => {
    setQrCode(null);
    startQrMode();
  };
  
  const handleModeChange = (newMode: 'PHOTO' | 'VIDEO' | 'QR' | 'AR' | 'TEXT' | 'SMILE') => {
    setQrCode(null);
    setTranslatedText(null);
    if(isRecording) stopRecording();
    setMode(newMode);
  }

  const ShutterButton = () => (
    <motion.button
      onClick={handleCapture}
      disabled={!isCameraReady || mode === 'QR' || (mode === 'TEXT' && isTranslating) || (mode === 'SMILE')}
      className="w-16 h-16 rounded-full bg-white/30 p-1 backdrop-blur-sm flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={t('capture_button_label')}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div 
        className={cn("w-full h-full rounded-full",
          mode === 'VIDEO' ? 'bg-red-500' : 'bg-white',
          mode === 'TEXT' && 'bg-blue-500',
          mode === 'SMILE' && 'bg-yellow-400',
        )}
        animate={{ 
          scale: isRecording ? 0.6 : 1,
          borderRadius: isRecording ? '20%' : '50%'
        }}
        transition={{ duration: 0.2 }}
      >
        {mode === 'TEXT' && (isTranslating ? <Loader2 className="h-full w-full p-3 text-white animate-spin" /> : <Type className="h-full w-full p-4 text-blue-900" />)}
        {mode === 'SMILE' && <Smile className="h-full w-full p-3 text-yellow-900" />}
      </motion.div>
    </motion.button>
  );

  const ModeSwitcher = () => (
    <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/80">
      <button onClick={() => handleModeChange('QR')} className={cn("transition-colors", mode === 'QR' && 'text-accent font-semibold')}>{t('mode_qr')}</button>
      <button onClick={() => handleModeChange('PHOTO')} className={cn("transition-colors", mode === 'PHOTO' && 'text-accent font-semibold')}>{t('mode_photo')}</button>
      <button onClick={() => handleModeChange('VIDEO')} className={cn("transition-colors", mode === 'VIDEO' && 'text-accent font-semibold')}>{t('mode_video')}</button>
      <button onClick={() => handleModeChange('AR')} className={cn("transition-colors flex items-center gap-1", mode === 'AR' && 'text-accent font-semibold')}>
        <Wand2 className="h-4 w-4" /> {t('mode_ar')}
      </button>
      <button onClick={() => handleModeChange('TEXT')} className={cn("transition-colors flex items-center gap-1", mode === 'TEXT' && 'text-accent font-semibold')}>
        <Type className="h-4 w-4" /> Text
      </button>
      <button onClick={() => handleModeChange('SMILE')} className={cn("transition-colors flex items-center gap-1", mode === 'SMILE' && 'text-accent font-semibold')}>
        <Smile className="h-4 w-4" /> Úsměv
      </button>
    </div>
  );

  const VideoPreview = () => (
    <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-2xl border-2 border-neutral-700">
            <video src={recordedVideo!} controls autoPlay className="w-full aspect-video"></video>
        </div>
        <div className="flex gap-4 mt-6">
            <Button onClick={() => setRecordedVideo(null)} variant="outline" className="bg-background/80">
                <X className="mr-2 h-4 w-4" /> Zpět
            </Button>
            <Button asChild>
              <a href={recordedVideo!} download="video.webm">
                <Download className="mr-2 h-4 w-4" /> Stáhnout
              </a>
            </Button>
        </div>
    </motion.div>
  );

  const ArObjectBoxes = () => {
    return null;
  };

const TranslatedTextBox = ({ translated }: { translated: { text: string, box: any } | null }) => {
  if (!translated || !videoRef.current) return null;
  const { videoWidth, videoHeight } = videoRef.current;
  const { offsetWidth, offsetHeight } = videoRef.current;
  const scaleX = offsetWidth / videoWidth;
  const scaleY = offsetHeight / videoHeight;

  const { x, y, width, height } = translated.box;

  return (
    <div
      className="absolute flex items-center justify-center p-2 bg-black/70 rounded-md"
      style={{
          left: `${x * scaleX}px`,
          top: `${y * scaleY}px`,
          width: `${width * scaleX}px`,
          height: `${height * scaleY}px`,
      }}
    >
      <p className="text-white text-sm font-semibold text-center">{translated.text}</p>
      <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-6 w-6 text-white bg-black/50 rounded-full" onClick={() => setTranslatedText(null)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};


  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="h-full w-full object-cover" 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {(!isCameraReady || (mode === 'SMILE' && !faceModelReady)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm font-medium">
                {mode === 'SMILE' && !faceModelReady ? 'Nahrávám model obličeje...' : 'Nahrávám kameru...'}
              </p>
            </div>
          </div>
        )}
        
        {mode === 'AR' && isCameraReady && <ArObjectBoxes />}
        {mode === 'TEXT' && translatedText && <TranslatedTextBox translated={translatedText} />}

        <AnimatePresence>
        {mode === 'QR' && qrCode && (
            <motion.div 
              className="absolute inset-x-4 top-14 z-20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
                <Alert variant="default" className="bg-background/90 backdrop-blur-sm">
                    <QrCode className="h-5 w-5" />
                    <AlertTitle className="flex justify-between items-center">
                        {t('qr_found_title')}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismissQrCode}>
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertTitle>
                    <AlertDescription className="break-all mt-2">
                        {qrCode}
                    </AlertDescription>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleCopyQrCode} size="sm" className="w-full">
                            <Copy className="mr-2 h-4 w-4" /> {t('qr_copy_button')}
                        </Button>
                        {qrCode.startsWith('http') && (
                             <Button asChild variant="secondary" size="sm" className="w-full">
                                <a href={qrCode} target="_blank" rel="noopener noreferrer">{t('open_link_button')}</a>
                            </Button>
                        )}
                    </div>
                </Alert>
            </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {recordedVideo && <VideoPreview />}
        </AnimatePresence>

        <AnimatePresence>
            {showStats && <CameraStats onBack={() => setShowStats(false)} />}
        </AnimatePresence>


        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <LanguageSwitcher />
             {hasTorch && (
                <Button variant="ghost" size="icon" onClick={toggleTorch} className={cn("text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10", isTorchOn && "text-accent bg-accent/20")}>
                    {isTorchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)} className="text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10">
                <BarChart2 className="h-5 w-5" />
            </Button>
        </div>
        <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10">
                <SwitchCamera className="h-5 w-5" />
            </Button>
        </div>

        {zoomCapabilities && (
          <div className="absolute bottom-40 left-4 right-4 z-10 flex items-center gap-2">
            <ZoomOut className="h-5 w-5 text-white" />
            <Slider
              min={zoomCapabilities.min}
              max={zoomCapabilities.max}
              step={zoomCapabilities.step}
              value={[zoom]}
              onValueChange={(value) => handleZoomChange(value[0])}
              className="w-full"
            />
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end gap-4 pb-5">
            <ModeSwitcher />
            <ShutterButton />
        </div>
      </div>
      
      <AnimatePresence>
        {capturedImage && mode === 'PHOTO' && (
          <PhotoLocationView
            imageSrc={capturedImage}
            onBack={() => setCapturedImage(null)}
          />
        )}

        {arSnapshot && mode === 'AR' && (
          <ArSnapshotView
              imageSrc={arSnapshot.image}
              label={arSnapshot.label}
              description={arSnapshot.description}
              onBack={() => setArSnapshot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
