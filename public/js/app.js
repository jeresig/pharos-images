$(function() {
    $("#selectArtist").select2({
        placeholder: "Search by Artist",
        minimumInputLength: 1,
        allowClear: true,
        ajax: {
            url: "/artists/search",
            dataType: "json",
            data: function(term) {
                return {q: term};
            },
            results: function(data) {
                return {
                    results: data.matches,
                    text: function(i) {
                        return data.matches[i].name.name;
                    }
                };
            }
        }
    });

    $(".date-range-picker").each(function() {
        var minDate = $(this).data("min-date");
        var maxDate = $(this).data("max-date");
        var $startDate = $(this).find("input[name=startDate]");
        var $endDate = $(this).find("input[name=endDate]");

        var slider = $(this).find(".slider").addClass("noUi-extended")[0];

        noUiSlider.create(slider, {
            range: {
                min: [minDate],
                max: [maxDate]
            },
            start: [$startDate.val() || minDate, $endDate.val() || maxDate],
            step: 5,
            connect: true,
            behaviour: "drag",
            pips: {
                mode: 'positions',
                values: [0,25,50,75,100],
                density: 4,
                stepped: true
            }
        });

        slider.noUiSlider.on("update", function(values) {
            $startDate.val(Math.round(values[0]));
            $endDate.val(Math.round(values[1]));
        });
    });
});