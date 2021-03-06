function removeAttributeValue(el, attr, value) {
  var re, m;
  if (el.getAttribute(attr)) {
    if (el.getAttribute(attr) == value) {
      el.removeAttribute(attr);
    } else {
      re = new RegExp('(^|\\s)' + value + '(\\s|$)');
      m = el.getAttribute(attr).match(re);
      if (m && m.length == 3) {
        el.setAttribute(attr, el.getAttribute(attr).replace(re, (m[1] && m[2])?' ':''))
      }
    }
  }
}

function addAttributeValue(el, attr, value) {
  var re;
  if (!el.getAttribute(attr)) {
    el.setAttribute(attr, value);
  }
  else {
    re = new RegExp('(^|\\s)' + value + '(\\s|$)');
    if (!re.test(el.getAttribute(attr))) {
      el.setAttribute(attr, el.getAttribute(attr) + ' ' + value);
    }
  }
};


function FormValidator(form, options) {
  this.form = form;
  this.errors = [];
  this.validators = [];
  $(this.form).on('submit', $.proxy(this, 'onSubmit'));
  this.summary = (options && options.summary) ? $(options.summary) : $('.govuk-error-summary');
  // this.summary.on('click', 'a', $.proxy(this, 'onErrorClick'));
  this.originalTitle = document.title;
};

FormValidator.entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

FormValidator.escapeHtml = function(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
    return FormValidator.entityMap[s];
  });
};

FormValidator.prototype.onErrorClick = function(e) {
  e.preventDefault();
  var href = e.target.href;
  var id = href.substring(href.indexOf("#"), href.length);
  $(id).focus();
};

FormValidator.prototype.resetTitle = function() {
  document.title = this.originalTitle;
};

FormValidator.prototype.updateTitle = function() {
  document.title = "" + this.errors.length + " errors - " + document.title;
};

FormValidator.prototype.showSummary = function () {
  this.summary.html(this.getSummaryHtml());
  this.summary.removeClass('js-hidden');
  this.summary.attr('aria-labelledby', 'errorSummary-heading');
  this.summary.focus();
};

FormValidator.prototype.getSummaryHtml = function() {
  var html = '<h2 id="error-summary-title" class="govuk-error-summary__title">There is a problem</h2>';
  html += '<div class="govuk-error-summary__body">';
  html += '<ul class="govuk-list govuk-error-summary__list">';
  for (var i = 0, j = this.errors.length; i < j; i++) {
    var error = this.errors[i];
    html += '<li>';
    html +=   '<a href="#' + FormValidator.escapeHtml(error.fieldName) + '">';
    html +=     FormValidator.escapeHtml(error.message);
    html +=   '</a>';
    html += '</li>';
  }
  html += '</ul>';
  html += '</div>';
  return html;
};

FormValidator.prototype.hideSummary = function() {
  this.summary.addClass('js-hidden');
  this.summary.removeAttr('aria-labelledby');
};

FormValidator.prototype.onSubmit = function (e) {
  this.removeInlineErrors();
  this.hideSummary();
  this.resetTitle();
  if(!this.validate()) {
    e.preventDefault();
    this.updateTitle();
    this.showSummary();
    this.showInlineErrors();
  }
};

FormValidator.prototype.showInlineErrors = function() {
  for (var i = 0, j = this.errors.length; i < j; i++) {
    this.showInlineError(this.errors[i]);
  }
};

FormValidator.prototype.showInlineError = function (error) {
  var errorSpanId = error.fieldName + '-error';
  var errorSpan = '<span class="govuk-error-message" id="'+ errorSpanId +'">'+FormValidator.escapeHtml(error.message)+'</span>';
  var control = $("#" + error.fieldName);
  var fieldContainer = control.parents(".govuk-form-group");
  var label = fieldContainer.find('label');
  var legend = fieldContainer.find("legend");
  var fieldset = fieldContainer.find("fieldset");
  fieldContainer.addClass('govuk-form-group--error');
  if(legend.length) {
    legend.after(errorSpan);
    fieldContainer.attr('aria-invalid', 'true');
    addAttributeValue(fieldset[0], 'aria-describedby', errorSpanId);
  } else {
    label.after(errorSpan);
    control.attr('aria-invalid', 'true');
    addAttributeValue(control[0], 'aria-describedby', errorSpanId);
  }
};

FormValidator.prototype.removeInlineErrors = function() {
  var error;
  var i;
  for (var i = 0; i < this.errors.length; i++) {
    this.removeInlineError(this.errors[i]);
  }
};

FormValidator.prototype.removeInlineError = function(error) {
  var control = $("#" + error.fieldName);
  var fieldContainer = control.parents(".govuk-form-group");
  fieldContainer.find('.govuk-error-message').remove();
  fieldContainer.removeClass('govuk-form-group--error');
  fieldContainer.find("[aria-invalid]").attr('aria-invalid', 'false');
  var errorSpanId = error.fieldName + '-error';
  removeAttributeValue(fieldContainer.find('[aria-describedby]')[0], 'aria-describedby', errorSpanId);
};

FormValidator.prototype.addValidator = function(fieldName, rules) {
  this.validators.push({
    fieldName: fieldName,
    rules: rules,
    field: this.form.elements[fieldName]
  });
};

FormValidator.prototype.validate = function() {
  this.errors = [];
  var validator = null,
    validatorValid = true,
    i,
    j;
  for (i = 0; i < this.validators.length; i++) {
    validator = this.validators[i];
    for (j = 0; j < validator.rules.length; j++) {
      validatorValid = validator.rules[j].method(validator.field,
        validator.rules[j].params);
      if (!validatorValid) {
        this.errors.push({
          fieldName: validator.fieldName,
          message: validator.rules[j].message
        });
        break;
      }
    }
  }
  return this.errors.length === 0;
};