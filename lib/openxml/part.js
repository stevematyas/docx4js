"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ole = require("./ole");

var OLE = _interopRequireWildcard(_ole);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Part = function () {
	function Part(name, doc) {
		_classCallCheck(this, Part);

		this.name = name;
		this.doc = doc;

		var folder = "";
		var relName = "_rels/" + name + ".rels";
		var i = name.lastIndexOf('/');

		if (i !== -1) {
			folder = name.substring(0, i + 1);
			relName = folder + "_rels/" + name.substring(i + 1) + ".rels";
		}

		if (doc.parts[relName]) {
			this.folder = folder;
			this.relName = relName;
			Object.defineProperty(this, "rels", {
				get: function get() {
					return this.doc.getObjectPart(this.relName);
				}
			});
		}
		this._init();
	}

	_createClass(Part, [{
		key: "_init",
		value: function _init() {
			Object.defineProperty(this, "content", {
				get: function get() {
					return this.doc.getObjectPart(this.name);
				}
			});
		}
	}, {
		key: "getRelTarget",
		value: function getRelTarget(type) {
			return this.rels("[Type$=\"" + type + "\"]").attr("Target");
		}
	}, {
		key: "getRelObject",
		value: function getRelObject(target) {
			return this.doc.getObjectPart(this.folder + target);
		}
	}, {
		key: "getRel",
		value: function getRel(id) {
			var rel = this.rels("Relationship[Id=\"" + id + "\"]");
			var target = rel.attr("Target");
			if (rel.attr("TargetMode") === 'External') return { url: target };

			var relType = rel.attr("Type") || ''; //avoid undefined

			switch (relType.split("/").pop()) {
				case 'image':
					var url = this.doc.getDataPartAsUrl(this.folder + target, "image/*");
					var crc32 = this.doc.getPartCrc32(this.folder + target);
					return { url: url, crc32: crc32 };
				default:
					if (target.endsWith(".xml")) return this.getRelObject(target);else return this.doc.getPart(this.folder + target);
			}
		}
	}, {
		key: "_nextrId",
		value: function _nextrId() {
			return Math.max.apply(Math, _toConsumableArray(this.rels('Relationship').toArray().map(function (a) {
				return parseInt(a.attribs.Id.substring(3));
			}))) + 1;
		}
	}, {
		key: "addImage",
		value: function addImage(data) {
			var type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
			var id = "rId" + this._nextrId();

			var targetName = "media/image" + (Math.max.apply(Math, _toConsumableArray(this.rels("Relationship[Type$='image']").toArray().map(function (t) {
				return parseInt(t.attribs.target.match(/\d+/)[0] || "0");
			}))) + 1) + ".jpg";

			var partName = "" + this.folder + targetName;
			this.doc.raw.file(partName, data);
			this.doc.parts[partName] = this.doc.raw.file(partName);

			this.rels("Relationships").append("<Relationship Id=\"" + id + "\" Type=\"" + type + "\" Target=\"" + partName + "\"/>");

			return id;
		}
	}, {
		key: "addExternalImage",
		value: function addExternalImage(url) {
			var type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";

			var id = "rId" + this._nextrId();

			this.rels("Relationships").append("<Relationship Id=\"" + id + "\" Type=\"" + type + "\" TargetMode=\"External\" Target=\"" + url + "\"/>");

			return id;
		}
	}, {
		key: "addChunk",
		value: function addChunk(data, relationshipType, contentType, ext) {
			relationshipType = relationshipType || "http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk";
			contentType = contentType || this.doc.constructor.mime;
			ext = ext || this.doc.constructor.ext;

			var id = this._nextrId();
			var rId = "rId" + id;
			var targetName = "chunk/chunk" + id + "." + ext;
			var partName = "" + this.folder + targetName;
			this.doc.raw.file(partName, data);
			this.doc.parts[partName] = this.doc.raw.file(partName);

			this.rels("Relationships").append("<Relationship Id=\"" + rId + "\" Type=\"" + relationshipType + "\" Target=\"" + targetName + "\"/>");

			this.doc.contentTypes.append("<Override PartName=\"/" + partName + "\" ContentType=\"" + contentType + "\"/>");

			return rId;
		}
	}, {
		key: "getRelOleObject",
		value: function getRelOleObject(rid) {
			var rel = this.rels("Relationship[Id=" + rid + "]");
			var type = rel.attr("Type");
			var targetName = rel.attr("Target");
			var data = this.doc.getDataPart("" + this.folder + targetName);
			switch (type.split("/").pop()) {
				case "oleObject":
					return OLE.parse(data);
				default:
					return data;
			}
		}
	}, {
		key: "removeRel",
		value: function removeRel(id) {
			var rel = this.rels("Relationship[Id=\"" + id + "\"]");
			if (rel.attr("TargetMode") !== "External") {
				var partName = this.folder + rel.attr("Target");
				this.doc.contentTypes.find("[PartName='/" + partName + "']").remove();
				this.doc.raw.remove(partName);
				delete this.doc.parts[partName];
			}
			rel.remove();
		}
	}, {
		key: "renderNode",
		value: function renderNode(node) {
			var _this = this;

			var createElement = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (type, props, children) {
				type, props, children;
			};
			var identify = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (node) {
				return node.name.split(":").pop();
			};
			var tagName = node.name,
			    children = node.children,
			    id = node.id,
			    parent = node.parent;

			if (node.type == "text") {
				if (parent.name == "w:t") {
					return node.data;
				}
				return null;
			}

			var type = tagName;
			var props = {};

			if (identify) {
				var model = identify(node, this);
				if (!model) return null;

				if (typeof model == "string") {
					type = model;
				} else {
					var content = void 0;
					var _model = model;
					type = _model.type;
					content = _model.children;
					props = _objectWithoutProperties(_model, ["type", "children"]);

					if (content !== undefined) children = content;
				}
			}
			props.key = id;
			props.node = node;
			props.type = type;

			var childElements = [];
			if (children && children.length) {
				childElements = children.map(function (a) {
					return a ? _this.renderNode(a, createElement, identify) : null;
				}).filter(function (a) {
					return !!a;
				});
			}

			return createElement(type, props, childElements);
		}
	}]);

	return Part;
}();

exports.default = Part;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVueG1sL3BhcnQuanMiXSwibmFtZXMiOlsiT0xFIiwiUGFydCIsIm5hbWUiLCJkb2MiLCJmb2xkZXIiLCJyZWxOYW1lIiwiaSIsImxhc3RJbmRleE9mIiwic3Vic3RyaW5nIiwicGFydHMiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImdldE9iamVjdFBhcnQiLCJfaW5pdCIsInR5cGUiLCJyZWxzIiwiYXR0ciIsInRhcmdldCIsImlkIiwicmVsIiwidXJsIiwicmVsVHlwZSIsInNwbGl0IiwicG9wIiwiZ2V0RGF0YVBhcnRBc1VybCIsImNyYzMyIiwiZ2V0UGFydENyYzMyIiwiZW5kc1dpdGgiLCJnZXRSZWxPYmplY3QiLCJnZXRQYXJ0IiwiTWF0aCIsIm1heCIsInRvQXJyYXkiLCJtYXAiLCJwYXJzZUludCIsImEiLCJhdHRyaWJzIiwiSWQiLCJkYXRhIiwiX25leHRySWQiLCJ0YXJnZXROYW1lIiwidCIsIm1hdGNoIiwicGFydE5hbWUiLCJyYXciLCJmaWxlIiwiYXBwZW5kIiwicmVsYXRpb25zaGlwVHlwZSIsImNvbnRlbnRUeXBlIiwiZXh0IiwiY29uc3RydWN0b3IiLCJtaW1lIiwicklkIiwiY29udGVudFR5cGVzIiwicmlkIiwiZ2V0RGF0YVBhcnQiLCJwYXJzZSIsImZpbmQiLCJyZW1vdmUiLCJub2RlIiwiY3JlYXRlRWxlbWVudCIsInByb3BzIiwiY2hpbGRyZW4iLCJpZGVudGlmeSIsInRhZ05hbWUiLCJwYXJlbnQiLCJtb2RlbCIsImNvbnRlbnQiLCJ1bmRlZmluZWQiLCJrZXkiLCJjaGlsZEVsZW1lbnRzIiwibGVuZ3RoIiwicmVuZGVyTm9kZSIsImZpbHRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7SUFBWUEsRzs7Ozs7Ozs7OztJQUVTQyxJO0FBQ3BCLGVBQVlDLElBQVosRUFBaUJDLEdBQWpCLEVBQXFCO0FBQUE7O0FBQ3BCLE9BQUtELElBQUwsR0FBVUEsSUFBVjtBQUNBLE9BQUtDLEdB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RCxXQUFPLElBQVA7QUFDQTs7QUFFRCxPQUFJeEIsT0FBS2tELE9BQVQ7QUFDQSxPQUFJSCxRQUFNLEVBQVY7O0FBRUEsT0FBR0UsUUFBSCxFQUFZO0FBQ1gsUUFBSUcsUUFBTUgsU0FBU0osSUFBVCxFQUFjLElBQWQsQ0FBVjtBQUNBLFFBQUcsQ0FBQ08sS0FBSixFQUNDLE9BQU8sSUFBUDs7QUFFRCxRQUFHLE9BQU9BLEtBQVAsSUFBZSxRQUFsQixFQUEyQjtBQUMxQnBELFlBQUtvRCxLQUFMO0FBQ0EsS0FGRCxNQUVLO0FBQ0osU0FBSUMsZ0JBQUo7QUFESSxrQkFFZ0NELEtBRmhDO0FBRUZwRCxTQUZFLFVBRUZBLElBRkU7QUFFYXFELFlBRmIsVUFFSUwsUUFGSjtBQUV5QkQsVUFGekI7O0FBR0osU0FBR00sWUFBVUMsU0FBYixFQUNDTixXQUFTSyxPQUFUO0FBQ0Q7QUFDRDtBQUNETixTQUFNUSxHQUFOLEdBQVVuRCxFQUFWO0FBQ0EyQyxTQUFNRixJQUFOLEdBQVdBLElBQVg7QUFDQUUsU0FBTS9DLElBQU4sR0FBV0EsSUFBWDs7QUFFQSxPQUFJd0QsZ0JBQWMsRUFBbEI7QUFDQSxPQUFHUixZQUFZQSxTQUFTUyxNQUF4QixFQUErQjtBQUM5QkQsb0JBQWNSLFNBQVM3QixHQUFULENBQWE7QUFBQSxZQUFHRSxJQUFJLE1BQUtxQyxVQUFMLENBQWdCckMsQ0FBaEIsRUFBa0J5QixhQUFsQixFQUFnQ0csUUFBaEMsQ0FBSixHQUFnRCxJQUFuRDtBQUFBLEtBQWIsRUFDWlUsTUFEWSxDQUNMO0FBQUEsWUFBRyxDQUFDLENBQUN0QyxDQUFMO0FBQUEsS0FESyxDQUFkO0FBRUE7O0FBRUQsVUFBT3lCLGNBQ0w5QyxJQURLLEVBRUwrQyxLQUZLLEVBR0xTLGFBSEssQ0FBUDtBQUtBOzs7Ozs7a0JBdkxtQnRFLEkiLCJmaWxlIjoicGFydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIE9MRSBmcm9tIFwiLi9vbGVcIlxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXJ0e1xuXHRjb25zdHJ1Y3RvcihuYW1lLGRvYyl7XG5cdFx0dGhpcy5uYW1lPW5hbWVcblx0XHR0aGlzLmRvYz1kb2NcblxuXHRcdGxldCBmb2xkZXI9XCJcIlxuXHRcdGxldCByZWxOYW1lPVwiX3JlbHMvXCIrbmFtZStcIi5yZWxzXCJcblx0XHRsZXQgaT1uYW1lLmxhc3RJbmRleE9mKCcvJylcblxuXHRcdGlmKGkhPT0tMSl7XG5cdFx0XHRmb2xkZXI9bmFtZS5zdWJzdHJpbmcoMCxpKzEpXG5cdFx0XHRyZWxOYW1lPWZvbGRlcitcIl9yZWxzL1wiK25hbWUuc3Vic3RyaW5nKGkrMSkrXCIucmVsc1wiO1xuXHRcdH1cblxuXHRcdGlmKGRvYy5wYXJ0c1tyZWxOYW1lXSl7XG5cdFx0XHR0aGlzLmZvbGRlcj1mb2xkZXJcblx0XHRcdHRoaXMucmVsTmFtZT1yZWxOYW1lXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcInJlbHNcIix7XG5cdFx0XHRcdGdldCgpe1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvYy5nZXRPYmplY3RQYXJ0KHRoaXMucmVsTmFtZSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0dGhpcy5faW5pdCgpXG5cdH1cblxuXHRfaW5pdCgpe1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwiY29udGVudFwiLHtcblx0XHRcdGdldCgpe1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MuZ2V0T2JqZWN0UGFydCh0aGlzLm5hbWUpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdGdldFJlbFRhcmdldCh0eXBlKXtcblx0XHRyZXR1cm4gdGhpcy5yZWxzKGBbVHlwZSQ9XCIke3R5cGV9XCJdYCkuYXR0cihcIlRhcmdldFwiKVxuXHR9XG5cblx0Z2V0UmVsT2JqZWN0KHRhcmdldCl7XG5cdFx0cmV0dXJuIHRoaXMuZG9jLmdldE9iamVjdFBhcnQodGhpcy5mb2xkZXIrdGFyZ2V0KVxuXHR9XG5cblx0Z2V0UmVsKGlkKXtcblx0XHR2YXIgcmVsPXRoaXMucmVscyhgUmVsYXRpb25zaGlwW0lkPVwiJHtpZH1cIl1gKVxuXHRcdHZhciB0YXJnZXQ9cmVsLmF0dHIoXCJUYXJnZXRcIilcblx0XHRpZihyZWwuYXR0cihcIlRhcmdldE1vZGVcIik9PT0nRXh0ZXJuYWwnKVxuXHRcdFx0cmV0dXJuIHt1cmw6dGFyZ2V0fVxuXG4gICAgICAgIHZhciByZWxUeXBlID0gcmVsLmF0dHIoXCJUeXBlXCIpIHx8ICcnOyAvL2F2b2lkIHVuZGVmaW5lZFxuXG4gICAgICAgIHN3aXRjaChyZWxUeXBlLnNwbGl0KFwiL1wiKS5wb3AoKSl7XG5cdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0bGV0IHVybD10aGlzLmRvYy5nZXREYXRhUGFydEFzVXJsKHRoaXMuZm9sZGVyK3RhcmdldCwgXCJpbWFnZS8qXCIpXG5cdFx0XHRsZXQgY3JjMzI9dGhpcy5kb2MuZ2V0UGFydENyYzMyKHRoaXMuZm9sZGVyK3RhcmdldClcblx0XHRcdHJldHVybiB7dXJsLGNyYzMyfVxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRpZih0YXJnZXQuZW5kc1dpdGgoXCIueG1sXCIpKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRSZWxPYmplY3QodGFyZ2V0KVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kb2MuZ2V0UGFydCh0aGlzLmZvbGRlcit0YXJnZXQpXG5cdFx0fVxuXHR9XG5cblx0X25leHRySWQoKXtcblx0XHRyZXR1cm4gTWF0aC5tYXgoLi4udGhpcy5yZWxzKCdSZWxhdGlvbnNoaXAnKS50b0FycmF5KCkubWFwKGE9PnBhcnNlSW50KGEuYXR0cmlicy5JZC5zdWJzdHJpbmcoMykpKSkrMVxuXHR9XG5cblx0YWRkSW1hZ2UoZGF0YSl7XG5cdFx0Y29uc3QgdHlwZT1cImh0dHA6Ly9zY2hlbWFzLm9wZW54bWxmb3JtYXRzLm9yZy9vZmZpY2VEb2N1bWVudC8yMDA2L3JlbGF0aW9uc2hpcHMvaW1hZ2VcIlxuXHRcdGxldCBpZD1gcklkJHt0aGlzLl9uZXh0cklkKCl9YFxuXG5cdFx0bGV0IHRhcmdldE5hbWU9XCJtZWRpYS9pbWFnZVwiKyhNYXRoLm1heCguLi50aGlzLnJlbHMoXCJSZWxhdGlvbnNoaXBbVHlwZSQ9J2ltYWdlJ11cIikudG9BcnJheSgpLm1hcCh0PT57XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQodC5hdHRyaWJzLnRhcmdldC5tYXRjaCgvXFxkKy8pWzBdfHxcIjBcIilcblx0XHR9KSkrMSkrXCIuanBnXCI7XG5cblx0XHRsZXQgcGFydE5hbWU9YCR7dGhpcy5mb2xkZXJ9JHt0YXJnZXROYW1lfWBcblx0XHR0aGlzLmRvYy5yYXcuZmlsZShwYXJ0TmFtZSwgZGF0YSlcblx0XHR0aGlzLmRvYy5wYXJ0c1twYXJ0TmFtZV09dGhpcy5kb2MucmF3LmZpbGUocGFydE5hbWUpXG5cblx0XHR0aGlzLnJlbHMoXCJSZWxhdGlvbnNoaXBzXCIpXG5cdFx0XHQuYXBwZW5kKGA8UmVsYXRpb25zaGlwIElkPVwiJHtpZH1cIiBUeXBlPVwiJHt0eXBlfVwiIFRhcmdldD1cIiR7cGFydE5hbWV9XCIvPmApXG5cblx0XHRyZXR1cm4gaWRcblx0fVxuXG5cdGFkZEV4dGVybmFsSW1hZ2UodXJsKXtcblx0XHRjb25zdCB0eXBlPVwiaHR0cDovL3NjaGVtYXMub3BlbnhtbGZvcm1hdHMub3JnL29mZmljZURvY3VtZW50LzIwMDYvcmVsYXRpb25zaGlwcy9pbWFnZVwiXG5cblx0XHRsZXQgaWQ9YHJJZCR7dGhpcy5fbmV4dHJJZCgpfWBcblxuXHRcdHRoaXMucmVscyhcIlJlbGF0aW9uc2hpcHNcIilcblx0XHRcdC5hcHBlbmQoYDxSZWxhdGlvbnNoaXAgSWQ9XCIke2lkfVwiIFR5cGU9XCIke3R5cGV9XCIgVGFyZ2V0TW9kZT1cIkV4dGVybmFsXCIgVGFyZ2V0PVwiJHt1cmx9XCIvPmApXG5cblx0XHRyZXR1cm4gaWRcblx0fVxuXG5cdGFkZENodW5rKGRhdGEsIHJlbGF0aW9uc2hpcFR5cGUsIGNvbnRlbnRUeXBlLCBleHQpe1xuXHRcdHJlbGF0aW9uc2hpcFR5cGU9cmVsYXRpb25zaGlwVHlwZXx8XCJodHRwOi8vc2NoZW1hcy5vcGVueG1sZm9ybWF0cy5vcmcvb2ZmaWNlRG9jdW1lbnQvMjAwNi9yZWxhdGlvbnNoaXBzL2FGQ2h1bmtcIlxuXHRcdGNvbnRlbnRUeXBlPWNvbnRlbnRUeXBlfHx0aGlzLmRvYy5jb25zdHJ1Y3Rvci5taW1lXG5cdFx0ZXh0PWV4dHx8dGhpcy5kb2MuY29uc3RydWN0b3IuZXh0XG5cblx0XHRsZXQgaWQ9dGhpcy5fbmV4dHJJZCgpXG5cdFx0bGV0IHJJZD1gcklkJHtpZH1gXG5cdFx0bGV0IHRhcmdldE5hbWU9YGNodW5rL2NodW5rJHtpZH0uJHtleHR9YFxuXHRcdGxldCBwYXJ0TmFtZT1gJHt0aGlzLmZvbGRlcn0ke3RhcmdldE5hbWV9YFxuXHRcdHRoaXMuZG9jLnJhdy5maWxlKHBhcnROYW1lLCBkYXRhKVxuXHRcdHRoaXMuZG9jLnBhcnRzW3BhcnROYW1lXT10aGlzLmRvYy5yYXcuZmlsZShwYXJ0TmFtZSlcblxuXHRcdHRoaXMucmVscyhcIlJlbGF0aW9uc2hpcHNcIilcblx0XHRcdC5hcHBlbmQoYDxSZWxhdGlvbnNoaXAgSWQ9XCIke3JJZH1cIiBUeXBlPVwiJHtyZWxhdGlvbnNoaXBUeXBlfVwiIFRhcmdldD1cIiR7dGFyZ2V0TmFtZX1cIi8+YClcblxuXHRcdHRoaXMuZG9jLmNvbnRlbnRUeXBlc1xuXHRcdFx0LmFwcGVuZChgPE92ZXJyaWRlIFBhcnROYW1lPVwiLyR7cGFydE5hbWV9XCIgQ29udGVudFR5cGU9XCIke2NvbnRlbnRUeXBlfVwiLz5gKVxuXG5cdFx0cmV0dXJuIHJJZFxuXHR9XG5cdFxuXHRnZXRSZWxPbGVPYmplY3QocmlkKXtcblx0XHRsZXQgcmVsPXRoaXMucmVscyhgUmVsYXRpb25zaGlwW0lkPSR7cmlkfV1gKVxuXHRcdGxldCB0eXBlPXJlbC5hdHRyKFwiVHlwZVwiKVxuXHRcdGxldCB0YXJnZXROYW1lPXJlbC5hdHRyKFwiVGFyZ2V0XCIpXG5cdFx0bGV0IGRhdGE9dGhpcy5kb2MuZ2V0RGF0YVBhcnQoYCR7dGhpcy5mb2xkZXJ9JHt0YXJnZXROYW1lfWApXG5cdFx0c3dpdGNoKHR5cGUuc3BsaXQoXCIvXCIpLnBvcCgpKXtcblx0XHRcdGNhc2UgXCJvbGVPYmplY3RcIjpcblx0XHRcdFx0cmV0dXJuIE9MRS5wYXJzZShkYXRhKVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuIGRhdGFcblx0XHR9XG5cdFx0XG5cdH1cblx0XG5cdHJlbW92ZVJlbChpZCl7XG5cdFx0bGV0IHJlbD10aGlzLnJlbHMoYFJlbGF0aW9uc2hpcFtJZD1cIiR7aWR9XCJdYClcblx0XHRpZihyZWwuYXR0cihcIlRhcmdldE1vZGVcIikhPT1cIkV4dGVybmFsXCIpe1xuXHRcdFx0bGV0IHBhcnROYW1lPXRoaXMuZm9sZGVyK3JlbC5hdHRyKFwiVGFyZ2V0XCIpXG5cdFx0XHR0aGlzLmRvYy5jb250ZW50VHlwZXMuZmluZChgW1BhcnROYW1lPScvJHtwYXJ0TmFtZX0nXWApLnJlbW92ZSgpXG5cdFx0XHR0aGlzLmRvYy5yYXcucmVtb3ZlKHBhcnROYW1lKVxuXHRcdFx0ZGVsZXRlIHRoaXMuZG9jLnBhcnRzW3BhcnROYW1lXVxuXHRcdH1cblx0XHRyZWwucmVtb3ZlKClcblx0fVxuXG5cdHJlbmRlck5vZGUobm9kZSwgY3JlYXRlRWxlbWVudD0odHlwZSxwcm9wcyxjaGlsZHJlbik9Pnt0eXBlLHByb3BzLGNoaWxkcmVufSxpZGVudGlmeT1ub2RlPT5ub2RlLm5hbWUuc3BsaXQoXCI6XCIpLnBvcCgpKXtcblx0XHRsZXQge25hbWU6dGFnTmFtZSwgY2hpbGRyZW4saWQsIHBhcmVudH09bm9kZVxuXHRcdGlmKG5vZGUudHlwZT09XCJ0ZXh0XCIpe1xuXHRcdFx0aWYocGFyZW50Lm5hbWU9PVwidzp0XCIpe1xuXHRcdFx0XHRyZXR1cm4gbm9kZS5kYXRhXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdGxldCB0eXBlPXRhZ05hbWVcblx0XHRsZXQgcHJvcHM9e31cblxuXHRcdGlmKGlkZW50aWZ5KXtcblx0XHRcdGxldCBtb2RlbD1pZGVudGlmeShub2RlLHRoaXMpXG5cdFx0XHRpZighbW9kZWwpXG5cdFx0XHRcdHJldHVybiBudWxsXG5cblx0XHRcdGlmKHR5cGVvZihtb2RlbCk9PVwic3RyaW5nXCIpe1xuXHRcdFx0XHR0eXBlPW1vZGVsXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0bGV0IGNvbnRlbnQ7XG5cdFx0XHRcdCh7dHlwZSwgY2hpbGRyZW46Y29udGVudCwgLi4ucHJvcHN9PW1vZGVsKTtcblx0XHRcdFx0aWYoY29udGVudCE9PXVuZGVmaW5lZClcblx0XHRcdFx0XHRjaGlsZHJlbj1jb250ZW50XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHByb3BzLmtleT1pZFxuXHRcdHByb3BzLm5vZGU9bm9kZVxuXHRcdHByb3BzLnR5cGU9dHlwZVxuXG5cdFx0bGV0IGNoaWxkRWxlbWVudHM9W11cblx0XHRpZihjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpe1xuXHRcdFx0Y2hpbGRFbGVtZW50cz1jaGlsZHJlbi5tYXAoYT0+YSA/IHRoaXMucmVuZGVyTm9kZShhLGNyZWF0ZUVsZW1lbnQsaWRlbnRpZnkpIDogbnVsbClcblx0XHRcdFx0LmZpbHRlcihhPT4hIWEpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdHR5cGUsXG5cdFx0XHRcdHByb3BzLFxuXHRcdFx0XHRjaGlsZEVsZW1lbnRzXG5cdFx0XHQpXG5cdH1cbn1cbiJdfQ==