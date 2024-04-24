document.getElementById('MemberOneField').addEventListener('change', function() {
            var specificationField = document.getElementById('specificationFieldOne');
            if (this.value === 'Other') {
                specificationField.style.display = 'block'; // Show the text box
            } else {
                specificationField.style.display = 'none'; // Hide the text box
            }
        });

document.getElementById('MemberTwoField').addEventListener('change', function() {
            var specificationField = document.getElementById('specificationFieldTwo');
            if (this.value === 'Other') {
                specificationField.style.display = 'block'; // Show the text box
            } else {
                specificationField.style.display = 'none'; // Hide the text box
            }
        });

