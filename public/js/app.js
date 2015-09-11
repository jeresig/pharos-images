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

    var minDate = 1603;
    var maxDate = (new Date).getYear() + 1900;

    var $startDate = $("input[name='startDate']");
    var $endDate = $("input[name='endDate']");

    $(".slider").noUiSlider({
        range: [minDate, maxDate],
        start: [$startDate.val() || minDate, $endDate.val() || maxDate],
        step: 1,
        connect: true,
        behaviour: "drag",
        serialization: {
            resolution: 1,
            to: [$startDate, $endDate]
        }
    });
});