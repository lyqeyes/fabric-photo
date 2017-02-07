export default function() {
    let reader = new FileReader();
    let that = this;
    let {
        width,
        height
    } = this.getContainerViewBox();

    reader.onload = function() {
        let dataURI = that.dataURI = this.result;
        let img = new Image();
        img.onload = function() {
            let originWidth = this.width;
            let originHeight = this.height;
            let scale = 1;
            let imgWidth = originWidth,
                imgHeight = originHeight;
            if (imgWidth > width) {
                scale = width / imgWidth;
            }
            if (imgHeight > height) {
                let _scale = height / imgHeight;
                if (_scale < scale) {
                    scale = _scale;
                }
            }

            scale = Math.floor(scale * 10) / 10;

            imgWidth = imgWidth * scale;
            imgHeight = imgHeight * scale;
            let canvas = that.canvas = new fabric.Canvas(that.$container[0], {
                width: imgWidth,
                height: imgHeight,
                isDrawingMode: true
            });

            //create image
            fabric.Image.fromURL(dataURI, function(oImg) {
                canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                    originX: 'left',
                    originY: 'top',
                    left: 0,
                    top: 0
                });
            }, {
                width: imgWidth,
                height: imgHeight
            });

        };


        img.src = dataURI;
    }
    reader.readAsDataURL(this.source);
}
