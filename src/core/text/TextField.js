var JsDiff = require('diff');
import autobind from 'autobind-decorator';
import Char from './Char';
import HorizontalModule from './align/HorizontalModule';
import VerticalModule from './align/VerticalModule';
import CustomModule from './align/CustomModule'
import Metrics from '../Metrics';

@autobind
class TextField extends PIXI.Container {

    @Private _width = 0;
    @Private _height = 0;
    @Private _hitArea = null;

    @Private _box = null;
    @Private _text = "";
    @Private _map = {};

    @Private _customAlign = false;
    @Private _spaceBetweenLines = 0;
    @Private _spaceBetweenWords = -1;
    @Private _textAlign = "left";
    @Private _textLeftToRight = true;
    @Private _textTopToBottom = true;
    @Private _alignHorizontalPriority = true;

    @Private _defaultStyle = {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#000000'
    };

    @Private _mapStyle = [];
    @Private _customStyle = {};
    @Private _textSupport = document.createElement('div');

    @Private horizontalModule = null;
    @Private verticalModule = null;
    @Private customModule = null;

    constructor(width = 2048, height = 1152) {
        super();

        this._width = width;
        this._height = height;

        this._hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    get textLeftToRight() {
        return this._textLeftToRight;
    }

    set textLeftToRight(value) {
        this._textLeftToRight = value;
        this.relocate();
    }

    get textTopToBottom() {
        return this._textTopToBottom;
    }

    set textTopToBottom(value) {
        this._textTopToBottom = value;
        this.relocate();
    }

    get alignHorizontalPriority() {
        return this._alignHorizontalPriority;
    }
    set alignHorizontalPriority(value) {
        this._alignHorizontalPriority = value;
        this.relocate();
    }

    get customAlign() {
        return this._customAlign;
    }

    set customAlign(value) {
        this._customAlign = value;
        this.relocate();
    }

    get typeAlign() {
        return this._typeAlign;
    }

    set typeAlign(value) {
        this._typeAlign = value;
        this.relocate();
    }

    get align() {
        return this._textAlign;
    }

    set align(value) {
        this._textAlign = value;
        this.relocate();
    }

    get spaceBetweenLines() {
        return this._spaceBetweenLines;
    }

    set spaceBetweenLines(value) {
        this._spaceBetweenLines = value;
        this.relocate();
    }

    get spaceBetweenWords() {
        return this._spaceBetweenWords;
    }

    set spaceBetweenWords(value) {
        this._spaceBetweenWords = value;
        this.relocate();
    }


    setText(text, style = {}) {
        this._customStyle = style;

        if (this._customStyle.align) {
            this._textAlign = this._customStyle.align;
        }

        if (this._customStyle.spaceBetweenWords) {
            this._spaceBetweenWords = this._customStyle.spaceBetweenWords;
        }

        if (this._customStyle.spaceBetweenLines) {
            this._spaceBetweenLines = this._customStyle.spaceBetweenLines;
        }

        if (this._customStyle.leftToRight) {
            this._textLeftToRight = this._customStyle.leftToRight;
        }

        if (this._customStyle.topToBottom) {
            this._textTopToBottom = this._customStyle.topToBottom;
        }

        if (this._customStyle.horizontalPriority) {
            this._alignHorizontalPriority = this._customStyle.horizontalPriority;
        }

        this._textSupport.innerHTML = text;

        this._mapStyle.splice(0, this._mapStyle.length);

        this.getMap(this._textSupport.childNodes);

        var oldText = this._text;
        this._text = this._textSupport.innerText;

        var diff = JsDiff.diffChars(oldText, this._text);
        this._change(JsDiff.convertChangesToDMP(diff));
    }

    @Private getMap(nodes, parent = ["text"]) {
        for (var i = 0; i < nodes.length; i++) {
            var _n = nodes[i];
            if (_n.nodeName == "#text") {
                for (var j = 0; j < _n.length; j++) {
                    this._mapStyle.push({char: _n.nodeValue[j], style: parent})
                }
            } else {
                var arr = [];
                if (parent[0] == "text") {
                    arr[0] = _n.nodeName.toLowerCase();
                } else {
                    arr = parent.concat([]);
                    arr.push(_n.nodeName.toLowerCase())
                }
                this.getMap(_n.childNodes, arr);
            }
        }
    }

    @Private _change(diff) {
        var count = 0;

        for (var i = 0; i < diff.length; i++) {
            if (diff[i][0] === 0) {
                for (var zi = 0; zi < diff[i][1].length; zi++) {

                    if (this._mapStyle[count] == "text") {
                        count++;
                        continue;
                    }
                    this.children[count].setStyle(this._customStyle[this._mapStyle[count]]);
                    count++;

                }
            }

            if (diff[i][0] == 1) {
                for (var zj = 0; zj < diff[i][1].length; zj++) {
                    var st = this._mapStyle[count].style;
                    var style = this.buildStyle(st);

                    var char = new Char(diff[i][1].charAt(zj), style);

                    this.addChildAt(char, count);
                    count++;
                }
            }

            if (diff[i][0] == - 1) {
                for (var k = 0; k < diff[i][1].length; k++) {
                    var c = this.children[count];
                    this.removeChild(c);
                    c.destroy(true);
                    c = null;
                }
            }
        }

        this.relocate();
    }

    @Private buildStyle(styleRefs) {
        var temp = {};

        for (var j in this._defaultStyle) {
            temp[j] = this._defaultStyle[j];
        }

        for (var i = 0; i < styleRefs.length; i++) {
            if (styleRefs[i] === "text") {
                continue;
            } else {
                var st = this._customStyle[styleRefs[i]]
                for (var k in st) {
                    temp[k] = st[k];
                }
            }
        }

        return temp;
    }

    @Private relocate() {

        if (this._text == "") return;


        if (this._customAlign) {
            if (this.customModule === null) {
                this.customModule = new CustomModule();
            }

            this.customModule.typeAlign = this._typeAlign;
            this.customModule.align(this.children);
            this.blurinessFix();
            return;
        }


        if (isNaN(parseInt(this._spaceBetweenWords))) {
            this._spaceBetweenWords = -1;
        }

        if (isNaN(parseInt(this._spaceBetweenLines))) {
            this._spaceBetweenLines = -1;
        }

        if (this._alignHorizontalPriority) {
            if (this.horizontalModule === null) {
                this.horizontalModule = new HorizontalModule();
            }

            this.horizontalModule._textAlign = {} = this._textAlign;
            this.horizontalModule._textLeftToRight = {} = this._textLeftToRight;
            this.horizontalModule._textTopToBottom = {} = this._textTopToBottom;
            this.horizontalModule._spaceBetweenLines = {} = this._spaceBetweenLines;
            this.horizontalModule._spaceBetweenWords = {} = this._spaceBetweenWords;

            this.horizontalModule.relocate(this._text, this.children, this._width, this._height);

            if (this.children.length > 0) {
                this.emit('textupdated', this.children[this.children.length - 1]);
            } else {
                this.emit('textupdated', null);
            }
            this.blurinessFix();
            return;
        }

        if (!this._alignHorizontalPriority) {
            if (this.verticalModule === null) {
                this.verticalModule = new VerticalModule();
            }

            this.verticalModule._textAlign = {} = this._textAlign;
            this.verticalModule._textLeftToRight = {} = this._textLeftToRight;
            this.verticalModule._textTopToBottom = {} = this._textTopToBottom;
            this.verticalModule._spaceBetweenLines = {} = this._spaceBetweenLines;
            this.verticalModule._spaceBetweenWords = {} = this._spaceBetweenWords;

            this.verticalModule.relocate(this._text, this.children, this._width, this._height);

            if (this.children.length > 0) {
                this.emit('textupdated', this.children[this.children.length - 1]);
            } else {
                this.emit('textupdated', null);
            }

            this.blurinessFix();
            return;
        }
    }

    @Private blurinessFix(){
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].x = Math.round(this.children[i].x);
            this.children[i].y = Math.round(this.children[i].y);
        }
    }
}

export default TextField;
