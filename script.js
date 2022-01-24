async function loadModel() {
  loaded = false;
  model = undefined;
  model = await tf.loadLayersModel("../model/model.json");
  loaded = true;
  return loaded
}
loaded = loadModel();

function remove_repeated_sequences(text) {
  splitted = text.split("")
  rep_indecies = []
  for (var i = 1; i < splitted.length; i++) {
    if (splitted[i] == splitted[i - 1]) rep_indecies.push(i)
  }
  for (i of rep_indecies) {
    splitted.splice(i, 1, "")
  }
  return splitted.join("")
}

function clean_arabic_text(text) {
  filtered_lines = [];
  lines = text.split("\n");
  for (line of lines) {
    if (line != "") {
      tokens = [];
      line_words = line.split(" ");
      for (word of line_words) {
        tokens.push(word.replace(/[^\u0600-\u06FF]/g, ""))
      }
      temp_line = [];
      for (word of tokens) {
        if (word != "") temp_line.push(word);
      }
      filtered_line = temp_line.join(" ")
      filtered_lines.push(filtered_line);
    }
  }
  filtered = filtered_lines.join("\n ");
  no_diacritics = filtered.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, "")
  no_punctuations = no_diacritics.replace(/'،؛؟«»!'/g, "")
  return remove_repeated_sequences(no_punctuations)
}

function text_to_sequences(text, dict) {
  tokens = text.split(" ")
  sequence = []
  for (token of tokens) {
    if (dict[token] != undefined) sequence.push(dict[token])
  }
  return sequence
}

function pad_sequences(sequence, max_length) {
  if (sequence.length > max_length) {
    console.log("Cannot pad. Sequence length bigger than max length. Returning empty array!")
    return []
  }
  else {
    padded = sequence.reverse()
    for (var i = sequence.length; i < max_length; i++) {
      padded.push(0)
    }
    final = [padded.reverse()]
    return final
  }
}

function words_to_vector(text, maxlen){
	var dict
  $.ajax ({
      url: "../vocabulary.json",
      async: false,
      dataType: 'json',
      success: function(data){
          dict = data
      }
  })
  cleaned = clean_arabic_text(text)
  sequenced = text_to_sequences(cleaned, dict)
  padded = pad_sequences(sequenced, maxlen)
  return padded
}

function detectClass(arr){
	max = Math.max(...arr)
	index = arr.indexOf(max)
//	document.write(arr)
	if (index==0) cls = 'Normal'
	if (index==1) cls = 'Discredit'
	if (index==2) cls = 'Damning'
	if (index==3) cls = 'Stereotyping & Objectification'
	if (index==4) cls = 'Threat of Violence'
	if (index==5) cls = 'Dominance'
	if (index==6) cls = 'Derailing'
	if (index==7) cls = 'Sexual Harassment'
	if (index==0) color = '#78b867'
	else color = '#fa3e3e'
	return [cls, max, color]
}

function classify() {
	text = document.getElementById("Text").value
	input = words_to_vector(text, 250)
	vector = tf.tensor2d(input)
	output = model.predict(vector)
	const outputData = output.dataSync()
  return outputData
}

function set_fill_color(index){
//  if (0 <= number && number < 0.25) return '#78b867'
//  if (0.25 <= number && number < 0.5) return '#fffc54'
//  if (0.5 <= number && number < 0.75) return '#ffb254'
//  if (0.75 <= number && number < 1) return '#fa3e3e'
}

meter = document.getElementsByClassName('meter_fill')[0]
css_vars = document.querySelector(':root')

document.addEventListener('DOMContentLoaded', function() {
    var result
    var link = document.getElementById('predict-button');
    // onClick's logic below:
    link.addEventListener('click', function() {
      text = document.getElementById("Text").value
      document.getElementById("status").innerHTML = "Status: Analyzing..."
      document.getElementById("status").style.color = "blue"
      setTimeout(function () {
        prediction_arr = classify();
        result = detectClass(prediction_arr)
      }, 0);
      setTimeout(function () {
        document.getElementById("status").innerHTML = "Status: Done"
        document.getElementById("status").style.color = "green"
      }, 0);
      setTimeout(function () {
        delta = (-360 + (result[1] * 360))
        delta_string = delta.toString()
        percentage = parseInt(result[1] * 100)
        percentage_string = percentage.toString() + '%'
        css_vars.style.setProperty('--delta', 'translate(' + delta_string + 'px)');
        css_vars.style.setProperty('--fill-color', result[2]);
        meter.classList.add("filling");
        document.getElementById("res_string").innerHTML = "Results:"
        document.getElementById("conf_string").innerHTML = "Confidence Percentage: " + percentage_string
        document.getElementById("dec_msg").innerHTML = "This comment was classified as:"
        document.getElementById("decision").innerHTML = result[0]
        document.getElementById("decision").style.color = result[2]
      }, 0);
    });
})

$(document).ready(function() {
    $('#Text').on('input change', function() {
        if($(this).val() != '' && loaded) {
            $('#predict-button').prop('disabled', false);
            $('#predict-button').prop('class', 'classify-button-enabled');
        } else {
            $('#predict-button').prop('disabled', true);
            $('#predict-button').prop('class', 'classify-button-disabled');
        }
    });
});