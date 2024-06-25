document.getElementById('RadioParticipationNo').addEventListener('change', function() {
            var specificationField = document.getElementById('SpecifcationNo');
            if (this.value === 'No') {
                specificationField.style.display = 'block'; // Show the text box
            } else {
                specificationField.style.display = 'none'; // Hide the text box
            }
        });

document.getElementById('RadioParticipationYes').addEventListener('change', function() {
            var specificationField = document.getElementById('SpecifcationNo');
            if (this.value === 'Yes') {
                specificationField.style.display = 'none'; // Show the text box
                document.getElementById('SpecifcationNo').value = ""
                document.getElementById('SpecifcationNo').removeAttribute("required")
                document.getElementById('SpecifcationNoOther').style.display = "none"
                document.getElementById('SpecifcationNoOther').value = ""
                document.getElementById('SpecifcationNoOther').removeAttribute("required");

            }
        });

document.getElementById('SpecifcationNo').addEventListener('change', function() {
            var specificationField = document.getElementById('SpecifcationNoOther');
            if (this.value === 'Other') {
                specificationField.style.display = 'block'; // Show the text box
            } else {
                specificationField.style.display = 'none'; // Hide the text box
                specificationField.value = ""
                document.getElementById('SpecifcationNoOther').removeAttribute("required");
            }
        });

