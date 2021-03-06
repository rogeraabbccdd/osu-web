﻿function Beatmap(ctx, osuFile, path) {
	this.context = ctx;
	this.animationFrame = null;
	this.osu = osuFile;
	this.path = path;
	this.audio = document.createElement('audio');
	this.hitObjects = new Array(this.osu.HitObjects.length);
	this.storyboard = new Storyboard(this.path, this.osu);

	this.startTime = null;

	this.color = [];
	this.circleBorder = [255, 255, 255];
	this.circleSize = 64 * (1 - 0.7 * ((this.osu.Difficulty.CircleSize - 5) / 5)) / 2;
}

Beatmap.prototype.init = function (cb) {
	var that = this;

	if (this.osu.Colours.SliderBorder) {
		this.circleBorder = this.osu.Colours.SliderBorder;
	}

	for (var key in this.osu.Colours) {
		var match = key.match(/^Combo(\d+)$/i);
		if (!match) continue;

		this.color[parseInt(match[1], 10) - 1] = this.osu.Colours[key];
	}

	if (this.color.length === 0) {
		this.color = [
			[0, 202, 0],
			[142, 240, 128],
			[242, 24, 57],
			[30, 240, 120]
		];
	}

	var ho = this.osu.HitObjects;
	var combo = 0;
	var comboText = 1;
	for (var i = 0; i < ho.length; ++i) {
		this.hitObjects[i] = new HitObject(this, ho[i]);
		if (this.hitObjects[i].type === 4 || this.hitObjects[i].type === 5 || this.hitObjects[i].type === 6) {
			if (i !== 0) {
				++combo;
			}
			comboText = 1;
		}
		if (i > 0 && this.hitObjects[i - 1].x === this.hitObjects[i].x && this.hitObjects[i - 1].y === this.hitObjects[i].y &&
			(this.hitObjects[i].type === 1 || this.hitObjects[i].type === 4 || this.hitObjects[i].type === 5)) {
			this.hitObjects[i].x += 10;
			this.hitObjects[i].y += 10;
		}

		this.hitObjects[i].combo = combo;
		this.hitObjects[i].comboText = comboText++;
	}

	this.storyboard.init(this.context);

	Utils.getURLFromPath(that.path + that.osu.General.AudioFilename, function (err, url) {
		if (err) {
			cb(err);
			return;
		}

		that.audio.src = url;
		cb(null);
	});
};

Beatmap.prototype.start = function () {
	var that = this;
	setTimeout(function () {
		that.audio.play()
	}, this.osu.General.AudioLeadIn);

	this.startTime = Date.now();
	this.animationFrame = window.requestAnimationFrame(this.draw.bind(this));
};

Beatmap.prototype.draw = function () {
	this.animationFrame = window.requestAnimationFrame(this.draw.bind(this));

	var width = this.context.canvas.width;
	var height = this.context.canvas.height;
	var ratioX = width / 640;
	var ratioY = height / 480;

	var diff = Date.now() - this.startTime;
	var curr;
	if (diff > this.osu.General.AudioLeadIn) {
		curr = this.audio.currentTime * 1000;
	} else {
		curr = diff - this.osu.General.AudioLeadIn;
	}

	this.context.clearRect(0, 0, width, height);
	this.storyboard.draw(this.context, ratioX, ratioY, curr);
	for (var i = 0; i < this.hitObjects.length; ++i) {
		this.hitObjects[i].draw(this.context, ratioX, ratioY, curr);
	}
};

Beatmap.prototype.stop = function () {
	this.audio.pause();
	window.cancelAnimationFrame(this.animationFrame);
};