function Item() {
	this.features = {};
	this.defaultFeatures = {};
	this.code = null;
}

// TODO: use a proxy to build another object with null features when removed, new features when added, etc... for "update" queries
Item.prototype.setFeature = function(name, value) {
	if(this.isValidFeatureName(name)) {
		this.features[name] = value;
		return true;
	} else {
		return false;
	}
};

Item.prototype.setCode = function(code) {
	if(this.isValidCode(code)) {
		this.code = code;
		return true;
	} else {
		return false;
	}
};

Item.prototype.setDefaultFeature = function(name, value) {
	if(this.isValidFeatureName(name)) {
		this.defaultFeatures[name] = value;
		return true;
	} else {
		return false;
	}
};

Item.prototype.removeFeature = function(name) {
	delete this.features[name];
};

Item.prototype.removeFeature = function(name) {
	delete this.defaultFeatures[name];
};

Item.prototype.isValidFeatureName = function(name) {
	return typeof name === 'string';
};

Item.prototype.isValidCode = function(code) {
	return this.isValidFeatureName(code);
};
